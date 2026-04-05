import { Module } from '@nestjs/common';
import { SpreadsheetProcessor } from './processors/spreadsheet.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [SpreadsheetProcessor],
})
export class SpreadsheetsModule {}
