import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly prisma: PrismaService) {}

  // --- Legal Reviews ---

  async getPendingLegalReviews() {
    // We fetch candidates that are in legal review status
    const candidates = await this.prisma.candidate.findMany({
      where: {
        status: {
          in: ['READY_FOR_LEGAL_REVIEW', 'LEGAL_REVIEW_IN_PROGRESS', 'LEGAL_MORE_INFO_REQUIRED']
        }
      },
      include: {
        documents: true,
        legalReviews: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Map to a consistent "Review" object for the frontend
    return candidates.map(c => ({
      id: c.legalReviews[0]?.id || `tmp_${c.id}`, // Use existing review or temp ID
      candidateId: c.id,
      candidate: c,
      status: c.legalReviews[0]?.status || 'PENDING',
      notes: c.legalReviews[0]?.notes || '',
      createdAt: c.legalReviews[0]?.createdAt || c.updatedAt
    }));
  }

  async approveLegalReview(candidateId: string, reviewerId: string, notes?: string) {
    // 1. Move Candidate to COORDINATOR_HANDOVER_PENDING
    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { status: 'COORDINATOR_HANDOVER_PENDING' }
    });

    // 2. Ensure a LegalReview record exists and is marked APPROVED
    const review = await this.prisma.legalReview.findFirst({
      where: { candidateId, status: 'PENDING' }
    });

    if (review) {
      await this.prisma.legalReview.update({
        where: { id: review.id },
        data: {
          status: 'APPROVED',
          notes: notes || 'Approved by system',
          reviewerId,
          decisionDate: new Date()
        }
      });
    } else {
      await this.prisma.legalReview.create({
        data: {
          candidateId,
          reviewerId,
          status: 'APPROVED',
          notes: notes || 'Initial approval',
          decisionDate: new Date()
        }
      });
    }

    // 3. Auto-create Handover record
    await this.prisma.coordinatorHandover.upsert({
      where: { candidateId },
      update: { status: 'PENDING' },
      create: {
        candidateId,
        status: 'PENDING'
      }
    });

    // 4. Activity
    await this.prisma.candidateActivity.create({
      data: {
        candidateId,
        actorId: reviewerId,
        type: 'LEGAL_APPROVED',
        description: `Legal review approved. Candidate advanced to Placement phase.`
      }
    });

    return { success: true };
  }

  // --- Coordinator Handovers ---

  async getActiveHandovers() {
    return this.prisma.coordinatorHandover.findMany({
      include: {
        candidate: true,
        coordinator: true
      },
      orderBy: [
        { plannedArrivalDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async updateHandover(id: string, data: any, actorId: string) {
    const handover = await this.prisma.coordinatorHandover.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: { candidate: true }
    });

    // If actualArrivalDate is set, move candidate to PLACED
    if (data.actualArrivalDate) {
      await this.prisma.candidate.update({
        where: { id: handover.candidateId },
        data: { status: 'PLACED' }
      });

      await this.prisma.candidateActivity.create({
        data: {
          candidateId: handover.candidateId,
          actorId,
          type: 'PLACED',
          description: `Candidate has arrived and is now Field Deployed (PLACED) at ${data.location || 'Unknown'}.`
        }
      });
    }

    return handover;
  }
  async getIssues() {
    return this.prisma.candidateIssue.findMany({
      include: { candidate: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createIssue(
    candidateId: string,
    userId: string,
    body: { issueType: string; details?: string; priority?: number }
  ) {
    // Validar que el candidato existe
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId }
    });
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

    const issue = await this.prisma.candidateIssue.create({
      data: {
        candidateId,
        type: body.issueType as any,
        title: `Issue: ${body.issueType}`,
        description: body.details || '',
        priority: body.priority || 3,
        status: 'OPEN'
      },
      include: { candidate: true }
    });

    // Log de actividad
    await this.prisma.candidateActivity.create({
      data: {
        candidateId,
        actorId: userId,
        type: 'ISSUE_CREATED',
        description: `Issue reported: ${body.issueType}. ${body.details || 'No details provided'}. Priority: ${body.priority || 3}`,
        metadata: {
          issueId: issue.id,
          issueType: body.issueType,
          priority: body.priority || 3
        }
      }
    });

    return issue;
  }
}
