import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SpreadsheetProcessor } from './processors/spreadsheet.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { QUEUE_NAMES } from '../shared/queue.constants';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.SPREADSHEET_INTAKE,
    }),
  ],
  providers: [SpreadsheetProcessor],
})
export class SpreadsheetsModule {}
