import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { ChangeCandidateStatusDto } from './dto/change-candidate-status.dto';
import { Candidate, CandidateStatus, Prisma } from '@prisma/client';

@Injectable()
export class CandidatesService {
  constructor(private prisma: PrismaService) {}

  async create(createCandidateDto: CreateCandidateDto): Promise<Candidate> {
    const { birthDate, availabilityDate, ...rest } = createCandidateDto;
    
    return this.prisma.candidate.create({
      data: {
        ...rest,
        birthDate: birthDate ? new Date(birthDate) : null,
        availabilityDate: availabilityDate ? new Date(availabilityDate) : null,
        statusHistory: {
          create: {
            toStatus: CandidateStatus.NEW_LEAD,
            notes: 'Initial creation',
          },
        },
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CandidateWhereUniqueInput;
    where?: Prisma.CandidateWhereInput;
    orderBy?: Prisma.CandidateOrderByWithRelationInput;
  }): Promise<Candidate[]> {
    return this.prisma.candidate.findMany({
      ...params,
      include: {
        recruiter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Candidate> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        recruiter: true,
        identifiers: true,
        aliases: true,
        documents: {
          include: {
            versions: {
              where: { isCurrent: true },
            },
          },
        },
        conversations: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        tasks: true,
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    return candidate;
  }

  async update(id: string, updateCandidateDto: UpdateCandidateDto, userId?: string): Promise<Candidate> {
    const { birthDate, availabilityDate, ...rest } = updateCandidateDto;
    
    const candidate = await this.prisma.candidate.update({
      where: { id },
      data: {
        ...rest,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        availabilityDate: availabilityDate ? new Date(availabilityDate) : undefined,
      },
    });

    if (userId) {
      const changedFields = Object.keys(rest);
      if (birthDate) changedFields.push('birthDate');
      if (availabilityDate) changedFields.push('availabilityDate');

      await this.prisma.candidateActivity.create({
          data: {
            candidateId: id,
            actorId: userId,
            type: 'PROFILE_UPDATE',
            description: `Updated candidate personal information: ${changedFields.join(', ')}`,
            metadata: { ...rest, birthDate, availabilityDate },
          },
      });
    }

    return candidate;
  }

  async changeStatus(id: string, changeStatusDto: ChangeCandidateStatusDto, userId: string): Promise<Candidate> {
    const candidate = await this.findOne(id);
    const oldStatus = candidate.status;

    return this.prisma.candidate.update({
      where: { id },
      data: {
        status: changeStatusDto.status,
        statusHistory: {
          create: {
            fromStatus: oldStatus,
            toStatus: changeStatusDto.status,
            notes: changeStatusDto.notes,
            changedById: userId,
          },
        },
        activities: {
          create: {
            actorId: userId,
            type: 'STATUS_CHANGE',
            description: `Transitioned status from ${oldStatus} to ${changeStatusDto.status}`,
            metadata: {
              from: oldStatus,
              to: changeStatusDto.status,
              notes: changeStatusDto.notes || 'No operational notes provided.',
            },
          },
        },
      },
    });
  }

  async getTimeline(id: string) {
    return this.prisma.candidateActivity.findMany({
      where: { candidateId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }
}
