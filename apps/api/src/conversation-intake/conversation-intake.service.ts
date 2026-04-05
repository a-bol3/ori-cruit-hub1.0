import { Injectable, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { QueuesService } from '../queues/queues.service';
import { parseConversationFilename } from './utils/parse-conversation-filename';
import { normalizeConversationText } from './utils/normalize-conversation-text';

@Injectable()
export class ConversationIntakeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queuesService: QueuesService,
  ) {}

  async uploadSingle(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('TXT file is required');

    if (!file.originalname.toLowerCase().endsWith('.txt')) {
      throw new BadRequestException('Only .txt files are allowed');
    }

    const rawText = file.buffer.toString('utf-8');
    const fileHash = createHash('sha256').update(file.buffer).digest('hex');

    // Deduplication check
    const existing = await this.prisma.candidateConversation.findFirst({
      where: { fileHash },
    });

    if (existing) {
      return {
        duplicate: true,
        conversationId: existing.id,
      };
    }

    const parsed = parseConversationFilename(file.originalname);
    const normalized = normalizeConversationText(rawText);

    // Auto-match candidate by phone if available
    let candidateId: string | null = null;
    if (parsed.phoneFromFile) {
      const phoneMatch = await this.prisma.candidate.findFirst({
        where: {
          OR: [
            { phone: parsed.phoneFromFile },
            { identifiers: { some: { value: parsed.phoneFromFile, type: 'PHONE' } } },
          ],
        },
      });
      if (phoneMatch) candidateId = phoneMatch.id;
    }

    const conversation = await this.prisma.candidateConversation.create({
      data: {
        rawText,
        normalizedText: normalized,
        fileHash,
        externalId: parsed.phoneFromFile,
        channel: parsed.sourceChannel as any,
        messageDate: parsed.dateFromFile || new Date(),
        candidateId,
      },
    });

    // Enqueue for AI extraction
    await this.queuesService.enqueueConversationIntake(conversation.id);

    return {
      duplicate: false,
      queued: true,
      autoLinked: !!candidateId,
      conversation,
    };
  }

  async uploadBatch(files: Express.Multer.File[]) {
    const results: any[] = [];
    for (const file of files) {
      results.push(await this.uploadSingle(file));
    }
    return results;
  }

  async getAll() {
    return this.prisma.candidateConversation.findMany({
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, status: true },
        },
      },
      orderBy: { messageDate: 'desc' },
    });
  }

  async getOne(id: string) {
    return this.prisma.candidateConversation.findUniqueOrThrow({
      where: { id },
      include: {
        candidate: true,
        extractions: true,
      },
    });
  }

  async linkCandidate(conversationId: string, candidateId: string) {
    return this.prisma.candidateConversation.update({
      where: { id: conversationId },
      data: { candidateId },
    });
  }
}
