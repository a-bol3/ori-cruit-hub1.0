import { Module } from '@nestjs/common';
import { ExtractionService } from './services/extraction.service';
import { DocumentProcessor } from './processors/document.processor';
import { ConversationProcessor } from './processors/conversation.processor';
import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
  imports: [PrismaModule],
  providers: [ExtractionService, DocumentProcessor, ConversationProcessor],
  exports: [ExtractionService],
})
export class ExtractionModule {}
