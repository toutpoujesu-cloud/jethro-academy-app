import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IJwtPayload } from '@jethro/shared';
import { ReviewService } from './review.service';
import { ReviewDecisionDto } from './dto/review-decision.dto';
import { SubmitLessonDto } from './dto/submit-lesson.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('review')
@ApiBearerAuth('access-token')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // POST /api/v1/review/lessons/:id/submit — Instructor or Admin+
  @Post('lessons/:id/submit')
  @Roles(UserRole.INSTRUCTOR, UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit lesson for review (Instructor submits own lesson)' })
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitLessonDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.reviewService.submitLesson(id, dto, user);
  }

  // GET /api/v1/review/queue — Admin+
  @Get('queue')
  @Roles(UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get pending review queue — all SUBMITTED lessons (Admin+)' })
  @ApiQuery({ name: 'page',  required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getQueue(
    @Query('page')  page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewService.getQueue({ page, limit });
  }

  // POST /api/v1/review/lessons/:id/decide — Admin+
  @Post('lessons/:id/decide')
  @Roles(UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or request revision on a submitted lesson (Admin+)' })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDecisionDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.reviewService.decide(id, dto, user);
  }

  // POST /api/v1/review/lessons/:id/archive — Admin+
  @Post('lessons/:id/archive')
  @Roles(UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive an approved lesson (Admin+)' })
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.reviewService.archive(id, user);
  }

  // GET /api/v1/review/lessons/:id/history — Admin+
  @Get('lessons/:id/history')
  @Roles(UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get full review history for a lesson (Admin+)' })
  history(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewService.getLessonHistory(id);
  }
}
