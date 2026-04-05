import { Module } from '@nestjs/common';
import { JobOrdersController } from './job-orders.controller';
import { JobOrdersService } from './job-orders.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JobOrdersController],
  providers: [JobOrdersService],
  exports: [JobOrdersService],
})
export class JobOrdersModule {}
