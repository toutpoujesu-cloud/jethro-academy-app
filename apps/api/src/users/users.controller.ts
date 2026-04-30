import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { UserRole, UserStatus } from '@prisma/client';
import { IJwtPayload } from '@jethro/shared';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteInstructorDto } from './dto/invite-instructor.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/v1/users — Admin+ only
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN)
  @ApiOperation({ summary: 'List all users (Admin+)' })
  @ApiQuery({ name: 'role',   required: false, enum: UserRole })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({ name: 'page',   required: false, type: Number })
  @ApiQuery({ name: 'limit',  required: false, type: Number })
  findAll(
    @Query('role')   role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('page')   page?: number,
    @Query('limit')  limit?: number,
  ) {
    return this.usersService.findAll({ role, status, page, limit });
  }

  // GET /api/v1/users/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  // PATCH /api/v1/users/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile (own or admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.usersService.update(id, dto, user);
  }

  // DELETE /api/v1/users/:id — Super Admin only
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a user (Super Admin only)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: IJwtPayload,
  ) {
    return this.usersService.remove(id, requester);
  }

  // PATCH /api/v1/users/:id/role — Super Admin only
  @Patch(':id/role')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign role to user (Super Admin only)' })
  assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() requester: IJwtPayload,
  ) {
    return this.usersService.assignRole(id, dto, requester);
  }

  // POST /api/v1/users/invite-instructor — Admin+
  @Post('invite-instructor')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN)
  @ApiOperation({ summary: 'Invite a new instructor (Admin+)' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  inviteInstructor(@Body() dto: InviteInstructorDto) {
    return this.usersService.inviteInstructor(dto);
  }

  // POST /api/v1/users/accept-invite — Public (no auth required)
  @Public()
  @Post('accept-invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept instructor invite and set password' })
  acceptInvite(
    @Body() body: { token: string; password: string },
  ) {
    return this.usersService.acceptInvite(body.token, body.password);
  }
}
