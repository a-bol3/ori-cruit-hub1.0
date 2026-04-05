import { Module } from '@nestjs/common';
import { ConversationIntakeService } from './conversation-intake.service';
import { ConversationIntakeController } from './conversation-intake.controller';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [QueuesModule],
  providers: [ConversationIntakeService],
  controllers: [ConversationIntakeController],
  exports: [ConversationIntakeService],
})
export class ConversationIntakeModule {}
