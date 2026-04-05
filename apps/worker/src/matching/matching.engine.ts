import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchType } from '@prisma/client';
import * as natural from 'natural';

export interface MatchResult {
  candidateId?: string;
  matchType: MatchType;
  score: number;
}

@Injectable()
export class MatchingEngine {
  constructor(private prisma: PrismaService) {}

  async findMatch(data: { 
    phone?: string; 
    email?: string; 
    firstName?: string; 
    lastName?: string;
    nationality?: string;
  }): Promise<MatchResult | null> {
    // 1. Exact Phone Match (Highest Priority)
    if (data.phone) {
      const candidate = await this.prisma.candidate.findUnique({
        where: { phone: data.phone },
      });
      if (candidate) {
        return {
          candidateId: candidate.id,
          matchType: 'EXACT_PHONE',
          score: 1.0,
        };
      }
    }

    // 2. Exact Email Match
    if (data.email) {
      const candidate = await this.prisma.candidate.findUnique({
        where: { email: data.email },
      });
      if (candidate) {
        return {
          candidateId: candidate.id,
          matchType: 'EXACT_EMAIL',
          score: 1.0,
        };
      }
    }

    // 3. Fuzzy Name Match
    if (data.firstName && data.lastName) {
      const fullName = `${data.firstName} ${data.lastName}`.toLowerCase();
      const candidates = await this.prisma.candidate.findMany({
        select: { id: true, firstName: true, lastName: true, nationality: true }
      });

      let bestMatch: { id: string, score: number } | null = null;

      for (const c of candidates) {
        const cFullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        const score = natural.JaroWinklerDistance(fullName, cFullName, { ignoreCase: true });

        // Add nationality bonus if it matches
        let finalScore = score;
        if (data.nationality && c.nationality && 
            data.nationality.toLowerCase() === c.nationality.toLowerCase()) {
          finalScore += 0.05; // Small boost for matching nationality
        }

        if (finalScore > 0.85 && (!bestMatch || finalScore > bestMatch.score)) {
          bestMatch = { id: c.id, score: Math.min(finalScore, 0.99) }; // Don't give 1.0 for fuzzy
        }
      }

      if (bestMatch) {
        return {
          candidateId: bestMatch.id,
          matchType: 'FUZZY_NAME',
          score: bestMatch.score,
        };
      }
    }

    return null;
  }
}
