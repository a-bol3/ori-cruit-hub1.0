import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SpreadsheetsController } from './spreadsheets.controller';
import { SpreadsheetsService } from './spreadsheets.service';
import { SpreadsheetProcessor } from './spreadsheet.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { QUEUE_NAMES } from '../queues/queue.constants';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.SPREADSHEET_INTAKE,
    }),
  ],
  controllers: [SpreadsheetsController],
  providers: [SpreadsheetsService, SpreadsheetProcessor],
  exports: [SpreadsheetsService],
})
export class SpreadsheetsModule {}
