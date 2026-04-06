import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../shared/queue.constants';
import { PrismaModule } from '../prisma/prisma.module';
import { ConversationExtractionProcessor } from '../queues/conversation-extraction.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.CONVERSATION_EXTRACTION,
    }),
    PrismaModule,
  ],
  providers: [ConversationExtractionProcessor],
})
export class ConversationsModule {}