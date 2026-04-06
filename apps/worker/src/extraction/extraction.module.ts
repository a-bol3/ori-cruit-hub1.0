import { Module } from '@nestjs/common';
import { ExtractionService } from './services/extraction.service';
import { DocumentProcessor } from './processors/document.processor';
import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
  imports: [PrismaModule],
  providers: [ExtractionService, DocumentProcessor],
  exports: [ExtractionService],
})
export class ExtractionModule {}
