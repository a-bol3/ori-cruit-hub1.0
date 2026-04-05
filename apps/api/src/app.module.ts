import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CandidatesModule } from './candidates/candidates.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DocumentsModule } from './documents/documents.module';
import { AuditModule } from './audit/audit.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

import { BullModule } from '@nestjs/bullmq';
import { StorageModule } from './storage/storage.module';
import { DocumentIntakeModule } from './document-intake/document-intake.module';
import { ExtractionModule } from './extraction/extraction.module';
import { SpreadsheetsModule } from './spreadsheets/spreadsheets.module';
import { ComplianceModule } from './compliance/compliance.module';
import { JobOrdersModule } from './job-orders/job-orders.module';
import { ReviewModule } from './review/review.module';
import { ConversationIntakeModule } from './conversation-intake/conversation-intake.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    CandidatesModule,
    ConversationsModule,
    DocumentsModule,
    StorageModule,
    DocumentIntakeModule,
    ExtractionModule,
    SpreadsheetsModule,
    ComplianceModule,
    JobOrdersModule,
    ReviewModule,
    ConversationIntakeModule,
    SearchModule,
    AuditModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6381', 10),
      },
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
