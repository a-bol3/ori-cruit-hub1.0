import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SpreadsheetImportStatus } from '@prisma/client';
import { QUEUE_NAMES } from '../queues/queue.constants';

@Injectable()
export class SpreadsheetsService {
  private readonly logger = new Logger(SpreadsheetsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    @InjectQueue(QUEUE_NAMES.SPREADSHEET_INTAKE) private spreadsheetQueue: Queue
  ) {}

  async createImport(file: Express.Multer.File, type: any) {
    this.logger.log(`Starting spreadsheet import: ${file.originalname}`);

    // 1. Upload to MinIO
    const bucket = process.env.MINIO_BUCKET_SPREADSHEETS || 'spreadsheet-imports';
    const objectKey = `imports/${Date.now()}-${file.originalname}`;
    
    await this.storageService.uploadObject({
      bucket,
      objectKey,
      body: file.buffer,
      mimeType: file.mimetype
    });
    // const fileUrl = await this.storageService.getSignedUrl(objectKey, bucket);

    // 2. Create Database Record
    const spreadsheetImport = await this.prisma.spreadsheetImport.create({
      data: {
        filename: file.originalname,
        fileUrl: objectKey, // Store the key, not the signed URL
        type: type || 'CANDIDATE_BASE',
        status: 'UPLOADED',
        rowCount: 0,
      }
    });

    // 3. Queue for Worker Processing
    await this.spreadsheetQueue.add('process-spreadsheet', {
      importId: spreadsheetImport.id,
      objectKey,
      bucket
    });

    return spreadsheetImport;
  }

  async getImports() {
    return this.prisma.spreadsheetImport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { rows: true }
        }
      }
    });
  }

  async getImportDetails(id: string) {
    const imp = await this.prisma.spreadsheetImport.findUnique({
      where: { id },
      include: {
        rows: {
          take: 50,
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!imp) throw new NotFoundException('Import not found');
    return imp;
  }

  async getImportRows(id: string, skip = 0, take = 50) {
    return this.prisma.spreadsheetImportRow.findMany({
      where: { importId: id },
      skip,
      take,
      orderBy: { createdAt: 'asc' }
    });
  }

  async getStats() {
    const totalProcessed = await this.prisma.spreadsheetImport.aggregate({
      _sum: { processedCount: true }
    });

    const activeBatches = await this.prisma.spreadsheetImport.count({
      where: { status: { not: 'COMPLETED' } }
    });

    return {
      totalIngested: totalProcessed._sum.processedCount || 0,
      activeBatches,
      recentCount: await this.prisma.candidate.count({
        where: { 
          source: 'SPREADSHEET',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })
    };
  }
}
