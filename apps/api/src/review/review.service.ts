import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async getQueue() {
    return this.prisma.reviewTask.findMany({
      where: { status: { in: ['PENDING', 'ASSIGNED'] } },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTaskById(id: string) {
    const task = await this.prisma.reviewTask.findUnique({
      where: { id },
      include: {
        candidate: true,
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    });

    if (!task) throw new NotFoundException('Review task not found');
    return task;
  }

  async assignTask(taskId: string, userId: string) {
    return this.prisma.reviewTask.update({
      where: { id: taskId },
      data: {
        assignedToId: userId,
        status: 'ASSIGNED',
      },
    });
  }

  async resolveTask(taskId: string, payload: { action: string; payload: any; userId: string }) {
    const task = await this.getTaskById(taskId);

    // 1. Process Action
    switch (payload.action) {
      case 'APPROVE_DOC':
        await this.handleApproveDoc(payload.payload);
        break;
      case 'REJECT_DOC':
        await this.handleRejectDoc(payload.payload);
        break;
      case 'LINK_CANDIDATE':
        await this.handleLinkCandidate(taskId, payload.payload);
        break;
      case 'CORRECT_DATA':
        await this.handleCorrectData(payload.payload, payload.userId);
        break;
      default:
        throw new Error(`Unsupported review action: ${payload.action}`);
    }

    // 2. Mark Task Completed
    return this.prisma.reviewTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        resolvedAt: new Date(),
        decisionMetadata: payload.payload,
      },
    });
  }

  private async handleApproveDoc(data: { documentId: string }) {
    await this.prisma.candidateDocument.update({
      where: { id: data.documentId },
      data: { reviewStatus: 'APPROVED' },
    });
  }

  private async handleRejectDoc(data: { documentId: string }) {
    await this.prisma.candidateDocument.update({
      where: { id: data.documentId },
      data: { reviewStatus: 'REJECTED' },
    });
  }

  private async handleLinkCandidate(taskId: string, data: { candidateId: string; type: string; sourceId: string }) {
    if (data.type === 'DOCUMENT') {
      await this.prisma.candidateDocument.update({
        where: { id: data.sourceId },
        data: { candidateId: data.candidateId },
      });
    } else if (data.type === 'CONVERSATION') {
      await this.prisma.candidateConversation.update({
        where: { id: data.sourceId },
        data: { candidateId: data.candidateId },
      });
    }
  }

  private async handleCorrectData(data: { type: string; sourceId: string; fields: any }, userId: string) {
    if (data.type === 'EXTRACTION') {
      // Update extraction results with corrected values
      for (const [extractionId, correctedValue] of Object.entries(data.fields)) {
        if (correctedValue && typeof correctedValue === 'string') {
          await this.prisma.extractionResult.update({
            where: { id: extractionId },
            data: {
              extractedValue: correctedValue,
              status: 'CONFIRMED',
              confidence: 1.0, // Mark as manually corrected
            },
          });
        }
      }

      // Create timeline activity for the correction
      const conversation = await this.prisma.candidateConversation.findUnique({
        where: { id: data.sourceId },
        include: { candidate: true },
      });

      if (conversation?.candidateId) {
        await this.prisma.candidateActivity.create({
          data: {
            candidateId: conversation.candidateId,
            type: 'DATA_UPDATED',
            description: `Extraction data corrected for conversation ${conversation.externalId}`,
            actorId: userId,
            metadata: {
              correctedFields: Object.keys(data.fields),
              sourceType: 'CONVERSATION',
              sourceId: data.sourceId,
            },
          },
        });
      }
    }
  }
}
