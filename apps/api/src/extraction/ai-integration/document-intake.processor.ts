import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai-integration/ai.service';
import { QUEUE_NAMES } from '../../queues/queue.constants';

@Processor(QUEUE_NAMES.DOCUMENT_INTAKE)
export class DocumentIntakeProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentIntakeProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing document intake job: ${job.id}`);
    const { documentId, versionId } = job.data;

    try {
      // 1. Fetch document and version
      const version = await this.prisma.candidateDocumentVersion.findUnique({
        where: { id: versionId },
        include: { document: true },
      });

      if (!version) {
        this.logger.error(`Document version ${versionId} not found`);
        return;
      }

      // 2. Simulated OCR (For now, we use the original filename + any text hint)
      // In a production app, we would use Tesseract or AWS Textract here.
      const simulatedOcrText = `
        Document Type: ${version.document.type}
        Original Filename: ${version.originalFilename}
        Confidence mapping: high
      `;

      // 3. Use AI to extract structured data
      const extractedData = await this.aiService.extractCandidateFromDocument(
        simulatedOcrText, 
        version.document.type
      );

      // 4. Update the document record with extraction results
      await this.prisma.candidateDocument.update({
        where: { id: documentId },
        data: {
          extractedName: `${extractedData.firstName || ''} ${extractedData.lastName || ''}`.trim(),
          extractedNumber: extractedData.identifierNumber,
          issuingCountry: extractedData.issuingCountry,
        }
      });

      // 5. Update Candidate if linked
      if (version.document.candidateId) {
        await this.prisma.candidate.update({
          where: { id: version.document.candidateId },
          data: {
            firstName: extractedData.firstName || undefined,
            lastName: extractedData.lastName || undefined,
          }
        });
      }

      // 6. Create Extraction entries for review
      for (const [field, value] of Object.entries(extractedData)) {
         await this.prisma.extractionResult.create({
           data: {
             sourceType: 'DOCUMENT',
             docVersionId: version.id,
             documentId: documentId,
             fieldName: field,
             extractedValue: String(value),
             confidence: 0.8,
             status: 'PENDING',
           }
         });
      }

      // 7. Create Review Task
      await this.prisma.reviewTask.create({
        data: {
          taskType: 'DOCUMENT_REVIEW',
          sourceType: 'DOCUMENT',
          sourceId: documentId,
          status: 'PENDING',
          priority: 'MEDIUM',
          candidateId: version.document.candidateId,
          decisionMetadata: {
            documentType: version.document.type,
            versionId: version.id,
          }
        }
      });
      this.logger.log(`Created ReviewTask for document ${documentId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Document processing failed: ${error.message}`);
      throw error;
    }
  }
}
