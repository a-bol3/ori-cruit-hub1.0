import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExtractionService } from '../services/extraction.service';

@Processor('document-intake')
export class DocumentProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly extractionService: ExtractionService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing document-intake: ${job.id} for version ${job.data.versionId}`);
    
    const { versionId } = job.data;

    // 1. Fetch the version and its parent document
    const version = await this.prisma.candidateDocumentVersion.findUnique({
      where: { id: versionId },
      include: { document: true }
    });

    if (!version) {
      this.logger.error(`Version ${versionId} not found`);
      return;
    }

    // 2. Perform Extraction
    // Note: If OCR text is missing, AI won't have context. 
    // In this MVP, we assume ocrText or file hints are the primary sources.
    const textToProcess = version.ocrText || version.originalFilename || '';
    const typeHint = version.document.type;

    const extractedData = await this.extractionService.extractFromDocument(textToProcess, typeHint);

    // 3. Save Extraction Results
    // We map the AI fields to our generalized ExtractionResult model
    const fieldsToSave = [
      { name: 'firstName', value: extractedData.firstName },
      { name: 'lastName', value: extractedData.lastName },
      { name: 'phone', value: extractedData.phone },
      { name: 'email', value: extractedData.email },
      { name: 'passportNumber', value: extractedData.passportNumber },
      { name: 'nationality', value: extractedData.nationality }
    ].filter(f => f.value);

    for (const field of fieldsToSave) {
      await this.prisma.extractionResult.create({
        data: {
          sourceType: 'DOCUMENT',
          docVersionId: version.id,
          documentId: version.documentId,
          fieldName: field.name,
          extractedValue: field.value,
          confidence: extractedData.confidence,
          status: 'PENDING'
        }
      });
    }

    // 4. Update the logical document with preview data
    await this.prisma.candidateDocument.update({
      where: { id: version.documentId },
      data: {
        extractedName: `${extractedData.firstName || ''} ${extractedData.lastName || ''}`.trim() || null,
        extractedNumber: extractedData.phone || extractedData.passportNumber || null,
        confidence: extractedData.confidence,
        isReadable: true
      }
    });

    this.logger.log(`Extraction complete for ${versionId}: saved ${fieldsToSave.length} fields.`);
    return { success: true, fieldsCount: fieldsToSave.length };
  }
}
