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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('modules')
@ApiBearerAuth()
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new module within a course (Admin+)' })
  @ApiResponse({ status: 201, description: 'Module created successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  create(@Body() dto: CreateModuleDto) {
    return this.modulesService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all modules for a course (Public)' })
  @ApiQuery({
    name: 'courseId',
    required: true,
    type: String,
    format: 'uuid',
    description: 'UUID of the parent course',
  })
  @ApiResponse({ status: 200, description: 'List of modules with their lessons.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  findByCourse(@Query('courseId', ParseUUIDPipe) courseId: string) {
    return this.modulesService.findByCourse(courseId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a single module by ID (Public)' })
  @ApiResponse({ status: 200, description: 'Module detail with lessons.' })
  @ApiResponse({ status: 404, description: 'Module not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.modulesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a module (Admin+)' })
  @ApiResponse({ status: 200, description: 'Module updated successfully.' })
  @ApiResponse({ status: 404, description: 'Module not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.modulesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a module (Admin+)' })
  @ApiResponse({ status: 200, description: 'Module deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Module not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.modulesService.remove(id);
  }
}
