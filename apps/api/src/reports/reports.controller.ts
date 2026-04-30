import { Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('reports')
@ApiBearerAuth('access-token')
@Roles(UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // GET /api/v1/reports/overview
  @Get('overview')
  @ApiOperation({ summary: 'Platform-wide overview stats (Admin+)' })
  overview() {
    return this.reportsService.overview();
  }

  // GET /api/v1/reports/enrollments
  @Get('enrollments')
  @ApiOperation({ summary: 'Enrollment report (Admin+)' })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'from',     required: false, type: String, description: 'ISO date' })
  @ApiQuery({ name: 'to',       required: false, type: String, description: 'ISO date' })
  @ApiQuery({ name: 'page',     required: false, type: Number })
  @ApiQuery({ name: 'limit',    required: false, type: Number })
  enrollments(
    @Query('courseId') courseId?: string,
    @Query('from')     from?: string,
    @Query('to')       to?: string,
    @Query('page')     page?: number,
    @Query('limit')    limit?: number,
  ) {
    return this.reportsService.enrollments({
      courseId,
      from:  from ? new Date(from) : undefined,
      to:    to   ? new Date(to)   : undefined,
      page,
      limit,
    });
  }

  // GET /api/v1/reports/revenue
  @Get('revenue')
  @ApiOperation({ summary: 'Revenue report grouped by course (Admin+)' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to',   required: false, type: String })
  revenue(
    @Query('from') from?: string,
    @Query('to')   to?: string,
  ) {
    return this.reportsService.revenue({
      from: from ? new Date(from) : undefined,
      to:   to   ? new Date(to)   : undefined,
    });
  }

  // GET /api/v1/reports/progress
  @Get('progress')
  @ApiOperation({ summary: 'Progress report (Admin+)' })
  @ApiQuery({ name: 'courseId', required: false })
  progress(@Query('courseId') courseId?: string) {
    return this.reportsService.progress({ courseId });
  }

  // GET /api/v1/reports/instructors
  @Get('instructors')
  @ApiOperation({ summary: 'Instructor activity report (Admin+)' })
  instructors() {
    return this.reportsService.instructors();
  }

  // GET /api/v1/reports/certificates
  @Get('certificates')
  @ApiOperation({ summary: 'Certificate issuance report (Admin+)' })
  @ApiQuery({ name: 'page',  required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  certificates(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.reportsService.certificates({ page, limit });
  }

  // GET /api/v1/reports/:type/export — CSV download
  @Get(':type/export')
  @Header('Content-Type', 'text/csv')
  @ApiOperation({ summary: 'Export report as CSV (Admin+)' })
  async export(
    @Param('type') type: 'enrollments' | 'revenue' | 'certificates',
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.exportCsv(type);
    res.setHeader('Content-Disposition', `attachment; filename="${type}-${Date.now()}.csv"`);
    res.send(csv);
  }
}
