import { Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import type { IRequest } from '@social/types/cores.type';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getGroupedNotifications(@Req() req: IRequest, @Query() query: any) {
    return this.notificationsService.getGroupedNotifications(req.user, query);
  }

  @Get('un-seen')
  async getUnSeenNotifications(@Req() req: IRequest) {
    return this.notificationsService.getUnSeenNotifications(req.user);
  }

  @Patch('read/:notificationId')
  async readNotification(@Param('notificationId') notificationId: string, @Req() req: IRequest) {
    return this.notificationsService.readNotifications(notificationId, req.user);
  }

  @Patch('seen')
  async seenNotification(@Req() req: IRequest) {
    return this.notificationsService.seenNotifications(req.user);
  }
}
