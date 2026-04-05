import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Request } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { ChangeCandidateStatusDto } from './dto/change-candidate-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  create(@Body() createCandidateDto: CreateCandidateDto) {
    return this.candidatesService.create(createCandidateDto);
  }

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('recruiterId') recruiterId?: string,
    @Query('jobOrderId') jobOrderId?: string,
    @Query('nationality') nationality?: string,
  ) {
    const where: any = { AND: [] };

    if (search) {
      where.AND.push({
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      });
    }

    if (status) where.AND.push({ status });
    if (recruiterId) where.AND.push({ recruiterId });
    if (nationality) where.AND.push({ nationality: { contains: nationality, mode: 'insensitive' } });
    if (jobOrderId) {
      where.AND.push({
        jobOrders: {
          some: { jobOrderId },
        },
      });
    }

    // Clean up if no filters applied
    const finalWhere = where.AND.length > 0 ? where : {};

    return this.candidatesService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: finalWhere,
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.candidatesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  update(@Param('id') id: string, @Body() updateCandidateDto: UpdateCandidateDto, @Request() req) {
    return this.candidatesService.update(id, updateCandidateDto, req.user?.id);
  }

  @Post(':id/status')
  changeStatus(
    @Param('id') id: string, 
    @Body() changeStatusDto: ChangeCandidateStatusDto,
    @Request() req,
  ) {
    return this.candidatesService.changeStatus(id, changeStatusDto, req.user.id);
  }

  @Get(':id/timeline')
  getTimeline(@Param('id') id: string) {
    return this.candidatesService.getTimeline(id);
  }

  @Get('export/csv')
  async exportCsv(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('recruiterId') recruiterId?: string,
    @Query('jobOrderId') jobOrderId?: string,
    @Query('nationality') nationality?: string,
  ) {
    // 1. Build the same where clause as findAll
    const where: any = { AND: [] };
    if (search) {
      where.AND.push({
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      });
    }
    if (status) where.AND.push({ status });
    if (recruiterId) where.AND.push({ recruiterId });
    if (nationality) where.AND.push({ nationality: { contains: nationality, mode: 'insensitive' } });
    if (jobOrderId) {
      where.AND.push({
        jobOrders: {
          some: { jobOrderId },
        },
      });
    }
    const finalWhere = where.AND.length > 0 ? where : {};

    // 2. Fetch all candidates matching criteria (without pagination for export)
    const candidates = await this.candidatesService.findAll({
      where: finalWhere,
      orderBy: { createdAt: 'desc' },
    });

    // 3. Convert to CSV
    const header = 'ID,First Name,Last Name,Email,Phone,Status,Nationality,Recruiter\n';
    const rows = candidates.map(c => {
      const recruiterName = (c as any).recruiter?.name || 'Unassigned';
      return `${c.id},"${c.firstName}","${c.lastName}","${c.email}","${c.phone}",${c.status},${c.nationality || 'N/A'},"${recruiterName}"`;
    }).join('\n');

    return header + rows;
  }
}
