import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IntakeProcessor } from './intake.processor';
import { ExtractionEngine } from '../extraction/extraction.engine';
import { MatchingEngine } from '../matching/matching.engine';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'conversation-intake',
    }),
  ],
  providers: [IntakeProcessor, ExtractionEngine, MatchingEngine],
})
export class IntakeModule {}
