import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ExtractionService } from './services/extraction.service';
import { DocumentProcessor } from './processors/document.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { QUEUE_NAMES } from '../shared/queue.constants';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.DOCUMENT_INTAKE,
    }),
  ],
  providers: [ExtractionService, DocumentProcessor],
  exports: [ExtractionService],
})
export class ExtractionModule {}
