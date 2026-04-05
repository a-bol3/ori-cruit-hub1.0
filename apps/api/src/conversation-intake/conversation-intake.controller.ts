import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConversationIntakeService } from './conversation-intake.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('intake/conversations')
export class ConversationIntakeController {
  constructor(private readonly conversationIntakeService: ConversationIntakeService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadSingle(@UploadedFile() file: Express.Multer.File) {
    return this.conversationIntakeService.uploadSingle(file);
  }

  @Post('upload-batch')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadBatch(@UploadedFiles() files: Express.Multer.File[]) {
    return this.conversationIntakeService.uploadBatch(files);
  }

  @Get()
  getAll() {
    return this.conversationIntakeService.getAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.conversationIntakeService.getOne(id);
  }

  @Post(':id/link-candidate')
  linkCandidate(
    @Param('id') id: string,
    @Body() body: { candidateId: string },
  ) {
    return this.conversationIntakeService.linkCandidate(id, body.candidateId);
  }
}
