import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IntakeProcessor } from './intake.processor';
import { ExtractionEngine } from '../extraction/extraction.engine';
import { MatchingEngine } from '../matching/matching.engine';
import { QUEUE_NAMES } from '../shared/queue.constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.CONVERSATION_INTAKE,
    }),
  ],
  providers: [IntakeProcessor, ExtractionEngine, MatchingEngine],
})
export class IntakeModule {}
