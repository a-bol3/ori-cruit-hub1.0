import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ExtractionEngine } from '../extraction/extraction.engine';
import { MatchingEngine } from '../matching/matching.engine';
import { QUEUE_NAMES } from '../shared/queue.constants';

@Processor(QUEUE_NAMES.CONVERSATION_INTAKE)
export class IntakeProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private extractionEngine: ExtractionEngine,
    private matchingEngine: MatchingEngine,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { conversationId, phoneNumber } = job.data;

    console.log(`Processing conversation ${conversationId} for ${phoneNumber}`);

    // 1. Fetch conversation
    const conversation = await this.prisma.candidateConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // 2. Normalize text (Placeholder)
    const normalizedText = conversation.rawText.trim();
    await this.prisma.candidateConversation.update({
      where: { id: conversationId },
      data: { normalizedText },
    });

    // 3. Extraction
    const extractedData = await this.extractionEngine.extract(normalizedText);

    // Store extraction results
    for (const [field, value] of Object.entries(extractedData)) {
      if (field === 'confidence' || field === 'interests') continue;
      if (value) {
        await this.prisma.extractionResult.create({
          data: {
            sourceType: 'CONVERSATION',
            conversationId: conversation.id,
            fieldName: field,
            extractedValue: value as string,
            confidence: extractedData.confidence,
          },
        });
      }
    }

    // 4. Matching
    const match = await this.matchingEngine.findMatch({
      phone: extractedData.phone || phoneNumber,
      email: extractedData.email,
      firstName: extractedData.firstName,
      lastName: extractedData.lastName,
      nationality: extractedData.nationality,
    });

    if (match) {
      // Link to candidate
      await this.prisma.candidateConversation.update({
        where: { id: conversationId },
        data: { candidateId: match.candidateId },
      });

      // Create matching decision record
      await this.prisma.matchingDecision.create({
        data: {
          conversationId: conversation.id,
          candidateId: match.candidateId,
          sourceType: 'CONVERSATION',
          matchType: match.matchType,
          score: match.score,
          status: match.score > 0.9 ? 'AUTO_LINKED' : 'PENDING_REVIEW',
        },
      });
    }

    return { status: 'COMPLETED', matched: !!match };
  }
}
