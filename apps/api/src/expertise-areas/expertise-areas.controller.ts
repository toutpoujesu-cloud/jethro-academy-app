import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ExpertiseAreasService } from './expertise-areas.service';
import { CreateExpertiseAreaDto } from './dto/create-expertise-area.dto';
import { UpdateExpertiseAreaDto } from './dto/update-expertise-area.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('expertise-areas')
@Controller('expertise-areas')
export class ExpertiseAreasController {
  constructor(private readonly service: ExpertiseAreasService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create expertise area (Admin+)' })
  create(@Body() dto: CreateExpertiseAreaDto) { return this.service.create(dto); }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all expertise areas (public)' })
  findAll() { return this.service.findAll(); }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get expertise area with courses (public)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(id); }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update expertise area (Admin+)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExpertiseAreaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete expertise area (Super Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.service.remove(id); }
}
