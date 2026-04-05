import { Module } from '@nestjs/common';
import { DocumentIntakeController } from './document-intake.controller';
import { DocumentIntakeService } from './document-intake.service';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [StorageModule, PrismaModule, QueuesModule],
  controllers: [DocumentIntakeController],
  providers: [DocumentIntakeService],
  exports: [DocumentIntakeService],
})
export class DocumentIntakeModule {}
