import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExtractionService } from '../services/extraction.service';
import { QUEUE_NAMES } from '../../shared/queue.constants';

@Processor(QUEUE_NAMES.CONVERSATION_INTAKE)
export class ConversationProcessor extends WorkerHost {
  private readonly logger = new Logger(ConversationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly extractionService: ExtractionService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing conversation-intake: ${job.id} for conversation ${job.data.conversationId}`);
    
    const { conversationId } = job.data;

    const conversation = await this.prisma.candidateConversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      this.logger.error(`Conversation ${conversationId} not found`);
      return;
    }

    // 1. Perform AI Extraction from Chat logs
    const textToProcess = conversation.rawText;
    const extractedData = await this.extractionService.extractFromDocument(textToProcess, 'whatsapp_chat');

    // 2. Save Extraction Results
    const fieldsToSave = [
      { name: 'firstName', value: extractedData.firstName },
      { name: 'lastName', value: extractedData.lastName },
      { name: 'phone', value: extractedData.phone || job.data.phoneNumber },
      { name: 'email', value: extractedData.email },
      { name: 'nationality', value: extractedData.nationality }
    ].filter(f => f.value);

    for (const field of fieldsToSave) {
      await this.prisma.extractionResult.create({
        data: {
          sourceType: 'CONVERSATION',
          conversationId: conversation.id,
          fieldName: field.name,
          extractedValue: field.value,
          confidence: extractedData.confidence,
          status: 'PENDING'
        }
      });
    }

    // 3. Update Conversation with AI Normalized text/summary if available
    await this.prisma.candidateConversation.update({
      where: { id: conversation.id },
      data: {
        normalizedText: textToProcess.slice(0, 1000), // Preview
        summary: `Extracted ${fieldsToSave.length} fields from AI.`
      }
    });

    this.logger.log(`Conversation extraction complete: ${conversationId}`);
    return { success: true, fieldsCount: fieldsToSave.length };
  }
}
