import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('queue')
  getQueue() {
    return this.reviewService.getQueue();
  }

  @Get(':id')
  getTask(@Param('id') id: string) {
    return this.reviewService.getTaskById(id);
  }

  @Patch(':id/assign')
  assign(@Param('id') id: string, @Request() req) {
    return this.reviewService.assignTask(id, req.user.id);
  }

  @Post(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() payload: { action: string; payload: any },
    @Request() req,
  ) {
    return this.reviewService.resolveTask(id, { ...payload, userId: req.user.id });
  }
}
