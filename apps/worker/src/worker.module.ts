import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { IntakeModule } from './intake/intake.module';
import { ExtractionModule } from './extraction/extraction.module';
import { SpreadsheetsModule } from './spreadsheets/spreadsheets.module';
import { StorageModule } from './storage/storage.module';
import { ConversationsModule } from './conversations/conversations.module';

function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
    };
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    BullModule.forRoot({
      connection: getRedisConnection(),
    }),
    IntakeModule,
    ExtractionModule,
    ConversationsModule,
    SpreadsheetsModule,
  ],
})
export class WorkerModule {}
