import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(query: string) {
    if (!query || query.length < 2) return { candidates: [], projects: [] };

    // Search candidates
    const candidates = await this.prisma.candidate.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: 5
    });

    // Search projects (job orders)
    const projects = await this.prisma.jobOrder.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { clientName: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 3
    });

    return { candidates, projects };
  }
}
