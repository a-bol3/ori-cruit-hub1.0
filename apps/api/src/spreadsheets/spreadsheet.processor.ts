import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import * as XLSX from 'xlsx';
import { QUEUE_NAMES } from '../queues/queue.constants';

@Processor(QUEUE_NAMES.SPREADSHEET_INTAKE)
export class SpreadsheetProcessor extends WorkerHost {
  private readonly logger = new Logger(SpreadsheetProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing spreadsheet job: ${job.id}`);
    const { importId, objectKey, bucket } = job.data;

    try {
      // 1. Update status to PARSING
      await this.prisma.spreadsheetImport.update({
        where: { id: importId },
        data: { status: 'PARSING' },
      });

      // 2. Download from MinIO
      const buffer = await this.storage.getObject(objectKey, bucket);

      // 3. Parse with XLSX
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

      this.logger.log(`Parsed ${rows.length} rows from spreadsheet`);

      // 4. Update row count
      await this.prisma.spreadsheetImport.update({
        where: { id: importId },
        data: { rowCount: rows.length, status: 'COMMITTING' },
      });

      let processedCount = 0;
      let errorCount = 0;

      // 5. Process each row
      for (const row of rows) {
        try {
          // Normalize row data
          const firstName = row['First Name'] || row['firstName'] || row['Name']?.split(' ')[0] || 'Unknown';
          const lastName = row['Last Name'] || row['lastName'] || row['Name']?.split(' ').slice(1).join(' ') || 'Candidate';
          const email = row['Email'] || row['email'];
          const phone = String(row['Phone'] || row['phone'] || '').replace(/\D/g, '');
          const nationality = row['Nationality'] || row['nationality'] || 'Global';

          // Create the record in import table first
          const importRow = await this.prisma.spreadsheetImportRow.create({
            data: {
              importId,
              rawContent: row,
              status: 'PENDING',
            }
          });

          // Check for existing candidate
          let candidate = await this.prisma.candidate.findFirst({
            where: {
              OR: [
                { email: email ? email : undefined },
                { phone: phone ? phone : undefined },
              ]
            }
          });

          if (!candidate) {
            candidate = await this.prisma.candidate.create({
              data: {
                firstName,
                lastName,
                email,
                phone,
                nationality,
                source: 'SPREADSHEET',
                status: 'NEW_LEAD',
              }
            });
            
            await this.prisma.spreadsheetImportRow.update({
              where: { id: importRow.id },
              data: { status: 'CREATED', candidateId: candidate.id }
            });
          } else {
            await this.prisma.spreadsheetImportRow.update({
              where: { id: importRow.id },
              data: { status: 'MATCHED', candidateId: candidate.id }
            });
          }
          processedCount++; // Increment for both created and matched to show total handled units

        } catch (rowError) {
          this.logger.error(`Error processing row: ${rowError.message}`);
          errorCount++;
        }
      }

      // 6. Create a Review Task for the entire batch
      if (processedCount > 0) {
        await this.prisma.reviewTask.create({
          data: {
            taskType: 'SPREADSHEET_BATCH_REVIEW',
            sourceType: 'SPREADSHEET',
            sourceId: importId,
            status: 'PENDING',
            priority: 'MEDIUM',
            decisionMetadata: {
              processedCount,
              errorCount,
            },
          }
        });
        this.logger.log(`Created ReviewTask for batch import ${importId}`);
      }

      // 7. Final status update
      await this.prisma.spreadsheetImport.update({
        where: { id: importId },
        data: { 
          status: 'COMPLETED',
          processedCount,
          errorCount
        },
      });

      this.logger.log(`Completed import ${importId}: ${processedCount} created, ${errorCount} errors`);

    } catch (error) {
      this.logger.error(`Spreadsheet processing failed: ${error.message}`);
      await this.prisma.spreadsheetImport.update({
        where: { id: importId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }
}
