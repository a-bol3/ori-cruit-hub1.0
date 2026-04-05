import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ExtractionController } from './extraction.controller';
import { ExtractionService } from './extraction.service';
import { AiService } from './ai-integration/ai.service';
import { ConversationIntakeProcessor } from './ai-integration/conversation-intake.processor';
import { DocumentIntakeProcessor } from './ai-integration/document-intake.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { QUEUE_NAMES } from '../queues/queue.constants';

@Module({
  imports: [
    PrismaModule, 
    StorageModule,
    BullModule.registerQueue(
      { name: QUEUE_NAMES.CONVERSATION_INTAKE },
      { name: QUEUE_NAMES.DOCUMENT_INTAKE }
    )
  ],
  controllers: [ExtractionController],
  providers: [
    ExtractionService, 
    AiService, 
    ConversationIntakeProcessor, 
    DocumentIntakeProcessor
  ],
  exports: [ExtractionService, AiService],
})
export class ExtractionModule {}
