import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async findAll() {
    return this.documentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get('versions/:versionId/signed-url')
  async getSignedUrl(@Param('versionId') versionId: string) {
    return this.documentsService.getVersionSignedUrl(versionId);
  }

  @Patch(':id/review')
  async review(@Param('id') id: string, @Body() body: any) {
    return this.documentsService.reviewDocument(id, body);
  }

  @Post(':id/link-candidate')
  async linkCandidate(@Param('id') id: string, @Body() body: { candidateId: string }) {
    return this.documentsService.linkCandidate(id, body.candidateId);
  }
}
