import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ExtractionService } from './extraction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('extractions')
@UseGuards(JwtAuthGuard)
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Get('pending')
  getPendingExtractions() {
    return this.extractionService.getPendingExtractions();
  }

  @Post(':id/confirm')
  confirmExtraction(
    @Param('id') id: string,
    @Body('confirmedValue') confirmedValue: string
  ) {
    return this.extractionService.confirmExtraction(id, confirmedValue);
  }

  @Post(':id/reject')
  rejectExtraction(@Param('id') id: string) {
    return this.extractionService.rejectExtraction(id);
  }
}
