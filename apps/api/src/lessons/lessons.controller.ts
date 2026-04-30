import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { UserRole } from '@prisma/client';
import { IJwtPayload } from '@jethro/shared';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

class AssignInstructorDto {
  @ApiProperty({ description: 'UUID of the instructor to assign', format: 'uuid' })
  @IsUUID()
  instructorId: string;
}

@ApiTags('lessons')
@ApiBearerAuth()
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new lesson within a module (Admin+)' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully.' })
  @ApiResponse({ status: 404, description: 'Module not found.' })
  @ApiResponse({ status: 409, description: 'Slug conflict within module.' })
  create(@Body() dto: CreateLessonDto) {
    return this.lessonsService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all lessons for a module (Public)' })
  @ApiQuery({
    name: 'moduleId',
    required: true,
    type: String,
    format: 'uuid',
    description: 'UUID of the parent module',
  })
  @ApiResponse({ status: 200, description: 'Ordered list of lessons for the module.' })
  @ApiResponse({ status: 404, description: 'Module not found.' })
  findByModule(@Query('moduleId', ParseUUIDPipe) moduleId: string) {
    return this.lessonsService.findByModule(moduleId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a single lesson by ID (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Lesson detail including module, quiz, assignment, and resources.',
  })
  @ApiResponse({ status: 404, description: 'Lesson not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessonsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({
    summary: 'Update a lesson (Admin+ or assigned instructor)',
  })
  @ApiResponse({ status: 200, description: 'Lesson updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden — not the assigned instructor.' })
  @ApiResponse({ status: 404, description: 'Lesson not found.' })
  @ApiResponse({ status: 409, description: 'Slug conflict within module.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLessonDto,
    @Request() req: { user: IJwtPayload },
  ) {
    return this.lessonsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a lesson (Admin+)' })
  @ApiResponse({ status: 200, description: 'Lesson deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Lesson not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessonsService.remove(id);
  }

  @Patch(':id/assign-instructor')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign an instructor to a lesson (Admin+)' })
  @ApiBody({ type: AssignInstructorDto })
  @ApiResponse({ status: 200, description: 'Instructor assigned successfully.' })
  @ApiResponse({ status: 404, description: 'Lesson or instructor user not found.' })
  @ApiResponse({
    status: 403,
    description: 'Target user does not have INSTRUCTOR role.',
  })
  assignInstructor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AssignInstructorDto,
  ) {
    return this.lessonsService.assignInstructor(id, body.instructorId);
  }
}
