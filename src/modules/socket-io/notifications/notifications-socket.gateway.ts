import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import type { INotificationUserTag } from '@social/types/notifications.type';
import { NOTIFICATION_MESSAGE } from '@social/utils/socket';
import { Socket } from 'socket.io';
import { NotificationsSocketService } from './notifications-socket.service';

@WebSocketGateway()
export class NotificationsSocketGateway {
  constructor(private readonly notificationsSocketService: NotificationsSocketService) {}

  @SubscribeMessage(NOTIFICATION_MESSAGE.POST_TAG)
  async handlePostTagNotification(@ConnectedSocket() client: Socket, @MessageBody() payload: INotificationUserTag) {
    return this.notificationsSocketService.postTagNotification(client, payload);
  }
}
