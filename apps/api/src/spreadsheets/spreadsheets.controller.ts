import { Controller, Get, Post, Param, Body, UseInterceptors, UploadedFile, UseGuards, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SpreadsheetsService } from './spreadsheets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('spreadsheets')
@UseGuards(JwtAuthGuard)
export class SpreadsheetsController {
  constructor(private readonly spreadsheetsService: SpreadsheetsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadSpreadsheet(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string
  ) {
    return this.spreadsheetsService.createImport(file, type);
  }

  @Get()
  getImports() {
    return this.spreadsheetsService.getImports();
  }

  @Get('stats')
  getStats() {
    return this.spreadsheetsService.getStats();
  }

  @Get(':id')
  getImportDetails(@Param('id') id: string) {
    return this.spreadsheetsService.getImportDetails(id);
  }

  @Get(':id/rows')
  getImportRows(
    @Param('id') id: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number
  ) {
    return this.spreadsheetsService.getImportRows(id, skip, take);
  }
}
