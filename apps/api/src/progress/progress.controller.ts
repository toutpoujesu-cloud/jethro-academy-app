import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IJwtPayload } from '@jethro/shared';
import { ProgressService } from './progress.service';
import { UpdateProgressDto, GradeAssignmentDto } from './dto/update-progress.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('progress')
@ApiBearerAuth('access-token')
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // POST /api/v1/progress/lessons/:lessonId — Learner updates own progress
  @Post('lessons/:lessonId')
  @ApiOperation({ summary: 'Update lesson progress (watch %, quiz, assignment submission)' })
  update(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.progressService.updateProgress(lessonId, dto, user);
  }

  // GET /api/v1/progress/courses/:courseId — Learner's own course summary
  @Get('courses/:courseId')
  @ApiOperation({ summary: 'Get own progress summary for a course' })
  getCourseProgress(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.progressService.getCourseProgress(courseId, user);
  }

  // PATCH /api/v1/progress/lessons/:lessonId/students/:studentId/grade — Instructor+ grade
  @Patch('lessons/:lessonId/students/:studentId/grade')
  @Roles(UserRole.INSTRUCTOR, UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Grade a student assignment (Instructor grades own lesson)' })
  gradeAssignment(
    @Param('lessonId',  ParseUUIDPipe) lessonId:  string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() dto: GradeAssignmentDto,
    @CurrentUser() grader: IJwtPayload,
  ) {
    return this.progressService.gradeAssignment(lessonId, studentId, dto, grader);
  }

  // GET /api/v1/progress/pending-grades — Admin+ only
  @Get('pending-grades')
  @Roles(UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all ungraded assignment submissions (Admin+)' })
  pendingGrades(
    @Query('page')  page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.progressService.getPendingGrades(page, limit);
  }
}
