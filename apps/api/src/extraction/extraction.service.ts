import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPendingExtractions() {
    // Group extractions by source (Document Version or Conversation)
    // for a better Review UI experience
    const extractions = await this.prisma.extractionResult.findMany({
      where: { status: 'PENDING' },
      include: {
        documentVersion: {
          include: { document: true }
        },
        conversation: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return extractions;
  }

  async confirmExtraction(id: string, confirmedValue: string) {
    const extraction = await this.prisma.extractionResult.findUnique({
      where: { id },
      include: { documentVersion: { include: { document: true } }, conversation: true }
    });

    if (!extraction) throw new NotFoundException('Extraction not found');

    // 1. Update the extraction record
    await this.prisma.extractionResult.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        extractedValue: confirmedValue
      }
    });

    // 2. Identify and Update the Target Candidate
    // Use the linked document or conversation to find the candidate
    const candidateId = extraction.documentVersion?.document?.candidateId || extraction.conversation?.candidateId;

    if (candidateId) {
      const updateData: any = {};
      if (extraction.fieldName === 'firstName') updateData.firstName = confirmedValue;
      if (extraction.fieldName === 'lastName') updateData.lastName = confirmedValue;
      if (extraction.fieldName === 'phone') updateData.phone = confirmedValue;
      if (extraction.fieldName === 'email') updateData.email = confirmedValue;
      if (extraction.fieldName === 'nationality') updateData.nationality = confirmedValue;

      if (Object.keys(updateData).length > 0) {
        await this.prisma.candidate.update({
          where: { id: candidateId },
          data: updateData
        });
        this.logger.log(`Updated candidate ${candidateId} with field ${extraction.fieldName}`);
      }
    }

    return { success: true };
  }

  async rejectExtraction(id: string) {
    await this.prisma.extractionResult.update({
      where: { id },
      data: { status: 'REJECTED' }
    });
    return { success: true };
  }
}
