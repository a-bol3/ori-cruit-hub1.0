import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import * as XLSX from 'xlsx';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Processor('spreadsheet-intake')
export class SpreadsheetProcessor extends WorkerHost {
  private readonly logger = new Logger(SpreadsheetProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing spreadsheet-intake: ${job.id} for import ${job.data.importId}`);
    
    const { importId, objectKey, bucket } = job.data;

    try {
      // 1. Download full file from MinIO
      // We need the raw buffer for XLSX to parse
      const fileBuffer = await this.downloadFile(bucket, objectKey);
      
      // 2. Parse Spreadsheet
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      this.logger.log(`Parsed ${rows.length} rows from ${objectKey}`);

      // 3. Update Import Record
      await this.prisma.spreadsheetImport.update({
        where: { id: importId },
        data: { 
          rowCount: rows.length,
          status: 'PARSING'
        }
      });

      // 4. Create SpreadsheetImportRows
      // We process in a batch to be efficient
      for (const row of rows) {
        await this.prisma.spreadsheetImportRow.create({
          data: {
            importId,
            rawContent: row as any,
            status: 'PENDING'
          }
        });
      }

      // 5. Final Update
      await this.prisma.spreadsheetImport.update({
        where: { id: importId },
        data: { 
          status: 'PARSED', // Status for "Parsing complete", next is "Reviewing"
          processedCount: rows.length
        }
      });

      this.logger.log(`Bulk ingestion complete for import ${importId}`);
      return { success: true, rowCount: rows.length };

    } catch (error) {
      this.logger.error(`Failed to process spreadsheet ${importId}`, error);
      await this.prisma.spreadsheetImport.update({
        where: { id: importId },
        data: { status: 'FAILED' }
      });
      throw error;
    }
  }

  private async downloadFile(bucket: string, key: string): Promise<Buffer> {
    // We use the storage service's S3 client to get the object
    // This is a bit lower level but necessary for workers
    const s3 = (this.storageService as any).s3 as S3Client;
    const response = await s3.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }));

    if (!response.Body) throw new Error('Empty response body from S3');

    const stream = response.Body as Readable;
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
