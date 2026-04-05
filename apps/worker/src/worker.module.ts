import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { IntakeModule } from './intake/intake.module';
import { ExtractionModule } from './extraction/extraction.module';
import { SpreadsheetsModule } from './spreadsheets/spreadsheets.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6381', 10),
      },
    }),
    IntakeModule,
    ExtractionModule,
    SpreadsheetsModule,
  ],
})
export class WorkerModule {}
