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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('intake/conversations')
export class ConversationIntakeController {
  constructor(private readonly conversationIntakeService: ConversationIntakeService) {}

  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
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
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
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
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  getAll() {
    return this.conversationIntakeService.getAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  getOne(@Param('id') id: string) {
    return this.conversationIntakeService.getOne(id);
  }

  @Post(':id/link-candidate')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  linkCandidate(
    @Param('id') id: string,
    @Body() body: { candidateId: string },
  ) {
    return this.conversationIntakeService.linkCandidate(id, body.candidateId);
  }
}
