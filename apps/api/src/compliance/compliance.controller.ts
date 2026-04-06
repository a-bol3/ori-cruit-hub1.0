import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest extends Request {
  user: { id: string };
}

interface UpdateHandoverBody {
  actualArrivalDate?: string;
  location?: string;
  [key: string]: unknown;
}

interface CreateIssueBody {
  candidateId: string;
  issueType: string;
  details?: string;
  priority?: string | number;
}

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
    @Req() req: AuthRequest,
  ) {
    const reviewerId = req.user?.id;
    if (!reviewerId) {
      throw new BadRequestException('Authenticated user not found');
    }
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
    @Body() data: UpdateHandoverBody,
    @Req() req: AuthRequest,
  ) {
    const actorId = req.user?.id;
    if (!actorId) {
      throw new BadRequestException('Authenticated user not found');
    }
    return this.complianceService.updateHandover(id, data, actorId);
  }

  // --- Issues ---

  @Get('issues')
  getIssues() {
    return this.complianceService.getIssues();
  }

  @Post('issues')
  createIssue(
    @Body() body: CreateIssueBody,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('Authenticated user not found');
    }

    const priority = typeof body.priority === 'string' ? parseInt(body.priority) : body.priority;
    return this.complianceService.createIssue(body.candidateId, userId, {
      ...body,
      priority,
    });
  }
}
