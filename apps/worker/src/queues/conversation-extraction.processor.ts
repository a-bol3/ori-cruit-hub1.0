import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { conversationAiParserService } from '../services/conversation-ai-parser.service';
import { QUEUE_NAMES } from '../shared/queue.constants';

@Processor(QUEUE_NAMES.CONVERSATION_EXTRACTION)
export class ConversationExtractionProcessor extends WorkerHost {
  private readonly logger = new Logger(ConversationExtractionProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { conversationId } = job.data;
    this.logger.log(`🔍 Processing conversation extraction for ID: ${conversationId}`);

    try {
      const conversation = await this.prisma.candidateConversation.findUnique({
        where: { id: conversationId },
        include: { candidate: true },
      });

      if (!conversation) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      const aiResult = await conversationAiParserService.parse({
        text: conversation.rawText || conversation.normalizedText || '',
        filename: conversation.externalId || undefined,
      });

      this.logger.log(`🤖 AI parsing completed for conversation ${conversationId}, confidence: ${aiResult.confidence}`);

      const extractionResults: Array<any> = [];

      const createExtraction = async (fieldName: string, value: any, confidence: number) => {
        if (value && typeof value === 'string' && value.trim()) {
          const extraction = await this.prisma.extractionResult.create({
            data: {
              sourceType: 'CONVERSATION',
              conversationId,
              fieldName,
              extractedValue: value.trim(),
              confidence,
              status: confidence > 0.8 ? 'CONFIRMED' : 'PENDING',
            },
          });
          extractionResults.push(extraction);
        }
      };

      await createExtraction('firstName', aiResult.extractedFields.firstName, aiResult.confidence);
      await createExtraction('lastName', aiResult.extractedFields.lastName, aiResult.confidence);
      await createExtraction('phone', aiResult.extractedFields.phone, aiResult.confidence);
      await createExtraction('email', aiResult.extractedFields.email, aiResult.confidence);
      await createExtraction('nationality', aiResult.extractedFields.nationality, aiResult.confidence);
      await createExtraction('currentCountry', aiResult.extractedFields.currentCountry, aiResult.confidence);
      await createExtraction('language', aiResult.extractedFields.language, aiResult.confidence);
      await createExtraction('offerInterest', aiResult.extractedFields.offerInterest, aiResult.confidence);
      await createExtraction('availabilityDate', aiResult.extractedFields.availabilityDate, aiResult.confidence);
      await createExtraction('travelDate', aiResult.extractedFields.travelDate, aiResult.confidence);
      await createExtraction('legalClue', aiResult.extractedFields.legalClue, aiResult.confidence);

      if (aiResult.extractedFields.documentMentions?.length) {
        for (const doc of aiResult.extractedFields.documentMentions) {
          await createExtraction('documentMention', doc, aiResult.confidence * 0.9);
        }
      }

      await this.prisma.candidateConversation.update({
        where: { id: conversationId },
        data: {
          summary: aiResult.summary,
        },
      });

      if (aiResult.confidence < 0.8 || aiResult.priority === 'HIGH' || aiResult.priority === 'URGENT') {
        const existingTask = await this.prisma.reviewTask.findFirst({
          where: {
            sourceId: conversationId,
            sourceType: 'CONVERSATION',
            status: { in: ['PENDING', 'ASSIGNED'] },
          },
        });

        if (!existingTask) {
          await this.prisma.reviewTask.create({
            data: {
              taskType: 'AI_EXTRACTION_REVIEW',
              sourceType: 'CONVERSATION',
              sourceId: conversationId,
              priority: aiResult.priority,
              status: 'PENDING',
              candidateId: conversation.candidateId,
              decisionMetadata: {
                aiConfidence: aiResult.confidence,
                extractedFieldsCount: extractionResults.length,
                intent: aiResult.intent,
                summary: aiResult.summary,
                description: `Review AI extraction for conversation: ${conversation.externalId || conversationId}`,
              },
            },
          });
          this.logger.log(`📋 Created review task for conversation ${conversationId} (confidence: ${aiResult.confidence})`);
        }
      }

      if (aiResult.confidence > 0.9 && !conversation.candidateId) {
        const candidateFilters: Array<{ phone?: string; email?: string }> = [];
        if (aiResult.extractedFields.phone) {
          candidateFilters.push({ phone: aiResult.extractedFields.phone });
        }
        if (aiResult.extractedFields.email) {
          candidateFilters.push({ email: aiResult.extractedFields.email });
        }

        if (candidateFilters.length > 0) {
          const potentialCandidates = await this.prisma.candidate.findMany({
            where: { OR: candidateFilters as any },
          });

          if (potentialCandidates.length === 1) {
            const candidate = potentialCandidates[0];
            const nameMatch = aiResult.extractedFields.firstName && aiResult.extractedFields.lastName
              ? candidate.firstName?.toLowerCase() === aiResult.extractedFields.firstName.toLowerCase() &&
                candidate.lastName?.toLowerCase() === aiResult.extractedFields.lastName.toLowerCase()
              : true;

            if (nameMatch) {
              await this.prisma.candidateConversation.update({
                where: { id: conversationId },
                data: { candidateId: candidate.id },
              });

              await this.prisma.candidateActivity.create({
                data: {
                  candidateId: candidate.id,
                  type: 'DATA_UPDATED',
                  description: `Conversation auto-linked via AI extraction: ${conversation.externalId}`,
                  metadata: {
                    sourceType: 'CONVERSATION',
                    sourceId: conversationId,
                    aiConfidence: aiResult.confidence,
                    autoLinked: true,
                  },
                },
              });

              this.logger.log(`🔗 Auto-linked conversation ${conversationId} to candidate ${candidate.id}`);
            }
          }
        }
      }

      this.logger.log(`✅ Conversation extraction completed for ${conversationId}. Created ${extractionResults.length} extraction results.`);
      return {
        conversationId,
        extractionResultsCount: extractionResults.length,
        aiConfidence: aiResult.confidence,
        reviewTaskCreated: aiResult.confidence < 0.8,
        autoLinked: aiResult.confidence > 0.9 && !conversation.candidateId,
      };
    } catch (error: any) {
      this.logger.error(`❌ Conversation extraction failed for ${conversationId}: ${error.message}`, error.stack);

      await this.prisma.candidateConversation.update({
        where: { id: conversationId },
        data: { summary: `Processing failed: ${error.message}` },
      });

      throw error;
    }
  }
}
