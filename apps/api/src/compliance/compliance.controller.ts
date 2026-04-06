import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  // --- Legal Reviews ---

  @Get('legal/pending')
  getPendingLegalReviews() {
    return this.complianceService.getPendingLegalReviews();
  }

  @Post('legal/:id/approve')
  approveLegalReview(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Req() req: any
  ) {
    const reviewerId = req.user.id;
    return this.complianceService.approveLegalReview(id, reviewerId, notes);
  }

  // --- Coordinator Handovers ---

  @Get('handovers/active')
  getActiveHandovers() {
    return this.complianceService.getActiveHandovers();
  }

  @Patch('handovers/:id')
  updateHandover(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any
  ) {
    const actorId = req.user.id;
    return this.complianceService.updateHandover(id, data, actorId);
  }

  // --- Issues ---

  @Get('issues')
  getIssues() {
    return this.complianceService.getIssues();
  }

  @Post('issues')
  createIssue(
    @Body() body: { candidateId: string; issueType: string; details?: string; priority?: string | number },
    @Req() req: any
  ) {
    const priority = typeof body.priority === 'string' ? parseInt(body.priority) : body.priority;
    return this.complianceService.createIssue(body.candidateId, req.user.id, {
      ...body,
      priority
    });
  }
}
