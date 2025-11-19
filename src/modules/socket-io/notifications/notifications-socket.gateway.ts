import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type {
  INotificationFriendRequest,
  INotificationFriendRequestAccept,
  INotificationFriendRequestCancel,
  INotificationFriendRequestReject,
  INotificationPostComment,
  INotificationPostLike,
  INotificationStoryReaction,
  INotificationUserTag,
} from '@social/types/notifications.type';
import { NOTIFICATION_MESSAGE } from '@social/utils/socket';
import { Server, Socket } from 'socket.io';
import { NotificationsSocketService } from './notifications-socket.service';

@WebSocketGateway()
export class NotificationsSocketGateway {
  constructor(private readonly notificationsSocketService: NotificationsSocketService) {}

  @WebSocketServer()
  private server: Server;

  @SubscribeMessage(NOTIFICATION_MESSAGE.POST_TAG)
  async handlePostTagNotification(@ConnectedSocket() client: Socket, @MessageBody() payload: INotificationUserTag) {
    return this.notificationsSocketService.postTagNotification(client, payload);
  }

  @SubscribeMessage(NOTIFICATION_MESSAGE.POST_LIKE)
  async handlePostLikeNotification(@ConnectedSocket() client: Socket, @MessageBody() payload: INotificationPostLike) {
    return this.notificationsSocketService.postLikeNotification(client, payload);
  }

  @SubscribeMessage(NOTIFICATION_MESSAGE.POST_COMMENT)
  async handlePostCommentNotification(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: INotificationPostComment,
  ) {
    return this.notificationsSocketService.postCommentNotification(client, payload);
  }

  @SubscribeMessage(NOTIFICATION_MESSAGE.STORY_REACTION)
  async handleStoryReactionNotification(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: INotificationStoryReaction,
  ) {
    return this.notificationsSocketService.storyReactionNotification(client, payload);
  }
  @SubscribeMessage(NOTIFICATION_MESSAGE.FRIEND_REQUEST)
  async handleFriendRequestNotification(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: INotificationFriendRequest,
  ) {
    return this.notificationsSocketService.friendRequestNotification(client, payload);
  }

  @SubscribeMessage(NOTIFICATION_MESSAGE.FRIEND_REQUEST_ACCEPT)
  async handleFriendRequestAcceptNotification(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: INotificationFriendRequestAccept,
  ) {
    return this.notificationsSocketService.friendRequestAcceptNotification(this.server, client, payload);
  }

  @SubscribeMessage(NOTIFICATION_MESSAGE.FRIEND_REQUEST_CANCEL)
  async handleFriendRequestCancelNotification(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: INotificationFriendRequestCancel,
  ) {
    return this.notificationsSocketService.friendRequestCancelNotification(client, payload);
  }

  @SubscribeMessage(NOTIFICATION_MESSAGE.FRIEND_REQUEST_REJECT)
  async handleFriendRequestRejectNotification(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: INotificationFriendRequestReject,
  ) {
    return this.notificationsSocketService.friendRequestRejectNotification(this.server, client, payload);
  }
}
