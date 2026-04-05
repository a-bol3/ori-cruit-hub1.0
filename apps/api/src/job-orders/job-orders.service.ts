import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobOrdersService {
  private readonly logger = new Logger(JobOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createJob(data: any) {
    this.logger.log(`Creating job order: ${data.title} for ${data.clientName}`);
    return this.prisma.jobOrder.create({
      data: {
        title: data.title,
        clientName: data.clientName,
        location: data.location,
        quota: parseInt(data.quota, 10),
        description: data.description,
        status: data.status || 'OPEN'
      }
    });
  }

  async getJobs() {
    // We include count of assigned candidates to calculate fill-rate
    return this.prisma.jobOrder.findMany({
      include: {
        _count: {
          select: { candidates: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getJobDetails(id: string) {
    const job = await this.prisma.jobOrder.findUnique({
      where: { id },
      include: {
        candidates: {
          include: {
            candidate: true
          }
        }
      }
    });
    if (!job) throw new NotFoundException('Job Order not found');
    return job;
  }

  async assignCandidate(jobOrderId: string, candidateId: string) {
    this.logger.log(`Assigning candidate ${candidateId} to job ${jobOrderId}`);
    
    // Check if assignment already exists
    const existing = await this.prisma.candidateJobOrder.findUnique({
      where: {
        candidateId_jobOrderId: { candidateId, jobOrderId }
      }
    });

    if (existing) return existing;

    return this.prisma.candidateJobOrder.create({
      data: {
        candidateId,
        jobOrderId
      }
    });
  }

  async getDashboardStats(filters: { jobOrderId?: string; startDate?: string; endDate?: string } = {}) {
    const { jobOrderId, startDate, endDate } = filters;

    // Base candidate filter
    const candWhere: any = {};
    if (startDate || endDate) {
      candWhere.createdAt = {};
      if (startDate) candWhere.createdAt.gte = new Date(startDate);
      if (endDate) candWhere.createdAt.lte = new Date(endDate);
    }

    // High-level pipeline stats
    // Note: If jobOrderId is provided, we filter candidates assigned to that job
    if (jobOrderId) {
      candWhere.jobOrders = { some: { jobOrderId } };
    }

    const pipeline = await this.prisma.candidate.groupBy({
      by: ['status'],
      where: candWhere,
      _count: { _all: true }
    });

    // Active Jobs and Counters
    const jobWhere: any = { status: 'OPEN' };
    if (jobOrderId) jobWhere.id = jobOrderId;

    const activeJobs = await this.prisma.jobOrder.findMany({
      where: jobWhere,
      include: {
        _count: { select: { candidates: true } }
      }
    });

    return {
      pipeline,
      activeJobs: activeJobs.length,
      totalQuota: activeJobs.reduce((acc, current) => acc + current.quota, 0),
      totalAssigned: activeJobs.reduce((acc, current) => acc + current._count.candidates, 0)
    };
  }
}
