import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { JobOrdersService } from './job-orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('job-orders')
@UseGuards(JwtAuthGuard)
export class JobOrdersController {
  constructor(private readonly jobOrdersService: JobOrdersService) {}

  @Get('stats')
  getDashboardStats(
    @Query('jobOrderId') jobOrderId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.jobOrdersService.getDashboardStats({ jobOrderId, startDate, endDate });
  }

  @Get()
  getJobs() {
    return this.jobOrdersService.getJobs();
  }

  @Post()
  createJob(@Body() data: any) {
    return this.jobOrdersService.createJob(data);
  }

  @Get(':id')
  getJobDetails(@Param('id') id: string) {
    return this.jobOrdersService.getJobDetails(id);
  }

  @Post(':id/assign')
  assignCandidate(
    @Param('id') id: string,
    @Body('candidateId') candidateId: string
  ) {
    return this.jobOrdersService.assignCandidate(id, candidateId);
  }
}
