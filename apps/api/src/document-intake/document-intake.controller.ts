import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentIntakeService } from './document-intake.service';

@Controller('document-intake')
export class DocumentIntakeController {
  constructor(private readonly intakeService: DocumentIntakeService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { candidateId?: string; sourcePath?: string }
  ) {
    return this.intakeService.uploadSingle(file, body);
  }
}
