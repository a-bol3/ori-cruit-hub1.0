import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService
  ) {}

  async findAll() {
    return this.prisma.candidateDocument.findMany({
      include: {
        candidate: true,
        versions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.candidateDocument.findUnique({
      where: { id },
      include: {
        candidate: true,
        versions: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async getVersionSignedUrl(versionId: string) {
    const version = await this.prisma.candidateDocumentVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) throw new NotFoundException('Document version not found');

    const url = await this.storageService.getSignedUrl(version.objectKey);
    return { url };
  }

  async reviewDocument(id: string, data: any) {
    return this.prisma.candidateDocument.update({
      where: { id },
      data,
    });
  }

  async linkCandidate(documentId: string, candidateId: string) {
    return this.prisma.candidateDocument.update({
      where: { id: documentId },
      data: { candidateId },
    });
  }
}
