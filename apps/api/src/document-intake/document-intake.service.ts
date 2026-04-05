import { Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { QueuesService } from '../queues/queues.service';
import { hashBuffer } from '../common/utils/hash-file';
import { parseDocumentFilename } from './utils/parse-document-filename';

@Injectable()
export class DocumentIntakeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly queuesService: QueuesService
  ) {}

  private inferDocumentTypeFromHint(hint?: string | null): any {
    if (!hint) return 'OTHER';

    const normalized = hint.toLowerCase();

    if (['paszport', 'passport'].includes(normalized)) return 'PASSPORT';
    if (['visa'].includes(normalized)) return 'VISA';
    if (['karta', 'kp'].includes(normalized)) return 'KARTA_POBYTU';
    if (['pesel'].includes(normalized)) return 'PESEL';
    if (['payment', 'proof'].includes(normalized)) return 'PAYMENT_PROOF';
    if (['contract'].includes(normalized)) return 'CONTRACT';
    if (['cv'].includes(normalized)) return 'OTHER';
    if (['photo'].includes(normalized)) return 'OTHER';

    return 'OTHER';
  }

  async uploadSingle(file: Express.Multer.File, metadata?: { candidateId?: string; sourcePath?: string }) {
    if (!file) throw new BadRequestException('File is required');

    const fileHash = hashBuffer(file.buffer);

    const existingVersion = await this.prisma.candidateDocumentVersion.findFirst({
      where: { fileHash },
      include: { document: true },
    });

    if (existingVersion) {
      return {
        duplicate: true,
        documentId: existingVersion.documentId,
        versionId: existingVersion.id,
      };
    }

    const parsed = parseDocumentFilename(file.originalname);
    const extension = path.extname(file.originalname).replace('.', '').toLowerCase() || parsed.extension || 'bin';

    let candidateId = metadata?.candidateId || null;

    // Try auto-matching if candidateId is missing
    if (!candidateId && parsed.phone) {
      const match = await this.prisma.candidate.findFirst({
        where: {
          OR: [
            { phone: parsed.phone },
            { identifiers: { some: { value: parsed.phone, type: 'PHONE' } } },
          ]
        }
      });
      if (match) {
        candidateId = match.id;
      }
    }

    const logicalDocument = await this.prisma.candidateDocument.create({
      data: {
        candidateId,
        type: this.inferDocumentTypeFromHint(parsed.documentTypeHint),
        title: parsed.raw,
        reviewStatus: 'PENDING',
        notes: parsed.nameParts.length ? `Filename clues: ${parsed.nameParts.join(' ')}` : null,
      },
    });

    const versionNumber = parsed.versionHint || 1;

    const objectKey = this.storageService.buildDocumentObjectKey({
      candidateId,
      documentId: logicalDocument.id,
      versionNumber,
      extension,
    });

    await this.storageService.uploadObject({
      objectKey,
      body: file.buffer,
      mimeType: file.mimetype,
    });

    const version = await this.prisma.candidateDocumentVersion.create({
      data: {
        documentId: logicalDocument.id,
        originalFilename: file.originalname,
        objectKey,
        mimeType: file.mimetype,
        fileExtension: extension,
        fileHash,
        fileSize: file.size,
        versionNumber,
        sourcePath: metadata?.sourcePath || null,
      },
    });

    // Enqueue for processing
    await this.queuesService.enqueueDocumentIntake(logicalDocument.id, version.id);

    return {
      duplicate: false,
      document: logicalDocument,
      version,
      filenameParsed: parsed,
    };
  }
}
