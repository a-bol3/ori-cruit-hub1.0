import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

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

  async delete(id: string) {
    const doc = await this.prisma.candidateDocument.findUnique({
      where: { id },
      include: { versions: true }
    });

    if (!doc) throw new NotFoundException(`Document ${id} not found`);

    // Eliminar archivos de S3
    for (const version of doc.versions) {
      try {
        await this.storageService.deleteObject(version.objectKey);
      } catch (err) {
        this.logger.warn(`Failed to delete S3 object ${version.objectKey}`, err.message);
      }
    }

    // Eliminar de BD
    await this.prisma.candidateDocument.delete({
      where: { id }
    });

    return { success: true, deletedId: id };
  }
}
