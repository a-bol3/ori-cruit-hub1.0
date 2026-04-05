import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';
import { QUEUE_NAMES, JOB_NAMES } from '../../queues/queue.constants';

@Processor(QUEUE_NAMES.CONVERSATION_INTAKE)
export class ConversationIntakeProcessor extends WorkerHost {
  private readonly logger = new Logger(ConversationIntakeProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing conversation intake job: ${job.id}`);
    const { conversationId } = job.data;

    try {
      // 1. Fetch the raw conversation
      const conversation = await this.prisma.candidateConversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        this.logger.error(`Conversation ${conversationId} not found`);
        return;
      }

      // 2. Use AI to extract data
      const extractedData = await this.aiService.extractCandidateFromConversation(conversation.rawText);
      this.logger.log(`AI Extracted data for conversation: ${JSON.stringify(extractedData)}`);

      // 3. Normalized text (optional)
      await this.prisma.candidateConversation.update({
        where: { id: conversationId },
        data: {
          summary: extractedData.summary || 'Extracted via AI',
        },
      });

      // 4. Create or Update Candidate
      if (extractedData.firstName || extractedData.phone) {
         // Check for existing candidate
         let candidate = await this.prisma.candidate.findFirst({
           where: {
             OR: [
               { phone: extractedData.phone || undefined },
               { email: extractedData.email || undefined },
             ]
           }
         });

         if (candidate) {
            // Update existing candidate
            await this.prisma.candidate.update({
              where: { id: candidate.id },
              data: {
                firstName: extractedData.firstName || candidate.firstName,
                lastName: extractedData.lastName || candidate.lastName,
                nationality: extractedData.nationality || candidate.nationality,
                // Do not overwrite phone/email if they exist
              }
            });
         } else {
            // Create new lead
            candidate = await this.prisma.candidate.create({
              data: {
                firstName: extractedData.firstName || 'Unknown',
                lastName: extractedData.lastName || 'WhatsApp Lead',
                phone: extractedData.phone,
                email: extractedData.email,
                nationality: extractedData.nationality,
                status: 'NEW_LEAD',
                source: 'WHATSAPP',
              }
            });
         }

         // Link conversation to candidate
         await this.prisma.candidateConversation.update({
           where: { id: conversationId },
           data: { candidateId: candidate.id },
         });

         // 5. Create Extraction Results for review (mandatory record keeping)
         for (const [field, value] of Object.entries(extractedData)) {
            if (['firstName', 'lastName', 'phone', 'email', 'nationality'].includes(field)) {
               await this.prisma.extractionResult.create({
                 data: {
                   sourceType: 'CONVERSATION',
                   conversationId: conversation.id,
                   fieldName: field,
                   extractedValue: String(value),
                   confidence: 0.95, // AI confidence approximation
                   status: 'PENDING',
                 }
               });
            }
         }

         // 6. Create Review Task
         await this.prisma.reviewTask.create({
           data: {
             taskType: 'AI_EXTRACTION_REVIEW',
             sourceType: 'CONVERSATION',
             sourceId: conversationId,
             status: 'PENDING',
             priority: 'HIGH',
             candidateId: candidate.id,
             decisionMetadata: {
               conversationId: conversation.id,
               type: 'WHATSAPP_INTAKE',
               extractedFields: Object.keys(extractedData)
             }
           }
         });
         this.logger.log(`Created ReviewTask for conversation ${conversationId}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Conversation processing failed: ${error.message}`);
      throw error;
    }
  }
}
