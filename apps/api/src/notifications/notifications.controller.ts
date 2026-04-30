import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IJwtPayload } from '@jethro/shared';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /api/v1/notifications
  @Get()
  @ApiOperation({ summary: 'Get own notifications (paginated)' })
  @ApiQuery({ name: 'page',       required: false, type: Number })
  @ApiQuery({ name: 'limit',      required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  findOwn(
    @CurrentUser() user: IJwtPayload,
    @Query('page')       page?: number,
    @Query('limit')      limit?: number,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.notificationsService.findOwn(user, { page, limit, unreadOnly });
  }

  // GET /api/v1/notifications/unread-count
  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count (for badge)' })
  unreadCount(@CurrentUser() user: IJwtPayload) {
    return this.notificationsService.unreadCount(user);
  }

  // PATCH /api/v1/notifications/:id/read
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.notificationsService.markRead(id, user);
  }

  // PATCH /api/v1/notifications/read-all
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: IJwtPayload) {
    return this.notificationsService.markAllRead(user);
  }
}
