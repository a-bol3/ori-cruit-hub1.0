import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_NAMES, JOB_NAMES } from '../queues/queue.constants';

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.CONVERSATION_INTAKE) private intakeQueue: Queue,
  ) {}

  async uploadConversation(file: Express.Multer.File) {
    const filename = file.originalname;
    
    // Pattern: [yyyymmdd]-[phone]-[channel].txt
    // Example: 20240315-48791000222-whatsapp.txt
    const pattern = /^(\d{8})-(\d+)-(\w+)\.txt$/;
    const match = filename.match(pattern);

    if (!match) {
      throw new BadRequestException(
        'Invalid filename format. Expected: [yyyymmdd]-[phone]-[channel].txt'
      );
    }

    const [_, dateStr, phoneNumber, channel] = match;
    const rawText = file.buffer.toString('utf-8');

    // 1. Create the conversation record
    const conversation = await this.prisma.candidateConversation.create({
      data: {
        channel: channel.toUpperCase() as any,
        rawText,
        externalId: phoneNumber,
        messageDate: new Date(
          `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
        ),
      },
    });

    // 2. Add to BullMQ for processing
    await this.intakeQueue.add(JOB_NAMES.CONVERSATION_INTAKE_PROCESS, {
      conversationId: conversation.id,
      phoneNumber,
    });

    return {
      id: conversation.id,
      message: 'Conversation uploaded and queued for processing',
    };
  }

  async listConversations(query: any) {
    return this.prisma.candidateConversation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getConversation(id: string) {
    return this.prisma.candidateConversation.findUnique({
      where: { id },
      include: {
        extractions: true,
        matches: true,
      },
    });
  }
}
