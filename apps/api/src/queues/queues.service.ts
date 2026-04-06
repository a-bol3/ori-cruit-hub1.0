import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from './queue.constants';

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

@Injectable()
export class QueuesService implements OnModuleDestroy {
  private readonly connection = getRedisConnection();

  private readonly queues: Map<string, Queue> = new Map();

  constructor() {
    // Initialize all queues from constants
    Object.values(QUEUE_NAMES).forEach((name) => {
      this.queues.set(name, new Queue(name, { connection: this.connection }));
    });
  }

  async onModuleDestroy() {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
  }

  async enqueueDocumentIntake(documentId: string, versionId: string) {
    const queue = this.queues.get(QUEUE_NAMES.DOCUMENT_INTAKE);
    if (!queue) throw new Error(`Queue ${QUEUE_NAMES.DOCUMENT_INTAKE} not found`);
    return queue.add(JOB_NAMES.DOCUMENT_INTAKE_PROCESS, { documentId, versionId });
  }

  async enqueueConversationIntake(conversationId: string) {
    const queue = this.queues.get(QUEUE_NAMES.CONVERSATION_INTAKE);
    if (!queue) throw new Error(`Queue ${QUEUE_NAMES.CONVERSATION_INTAKE} not found`);
    return queue.add(JOB_NAMES.CONVERSATION_INTAKE_PROCESS, { conversationId });
  }

  async enqueueConversationExtraction(conversationId: string) {
    const queue = this.queues.get(QUEUE_NAMES.CONVERSATION_EXTRACTION);
    if (!queue) throw new Error(`Queue ${QUEUE_NAMES.CONVERSATION_EXTRACTION} not found`);
    return queue.add(JOB_NAMES.CONVERSATION_EXTRACTION_PROCESS, { conversationId });
  }

  // Generic method for other enqueues as needed
  async addJob(queueName: string, jobName: string, data: any) {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);
    return queue.add(jobName, data);
  }
}
