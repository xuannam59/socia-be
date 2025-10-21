import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Model } from 'mongoose';
import { Notification } from 'src/modules/notifications/schemas/notification.schema';
import { InjectModel } from '@nestjs/mongoose';
import { UsersService } from '@social/users/users.service';
import { NOTIFICATION_MESSAGE } from '@social/utils/socket';
import {
  EEntityType,
  INotificationResponse,
  INotificationUserTag,
  ENotificationType,
} from '@social/types/notifications.type';

@Injectable()
export class NotificationsSocketService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private readonly usersService: UsersService,
  ) {}
  async postTagNotification(client: Socket, payload: INotificationUserTag) {
    try {
      const { postId, userTags, message } = payload;
      const sender = client.data.user;

      const userInfo = await this.usersService.findUserInfo(sender._id);
      if (!userInfo) {
        return;
      }
      const notifications = await this.notificationModel.insertMany(
        userTags.map(user => ({
          senderId: sender._id,
          receiverId: user._id,
          type: ENotificationType.POST_TAG,
          entityType: EEntityType.POST,
          entityId: postId,
          message,
        })),
      );
      const userIds = userTags.map(user => user._id);
      const data: INotificationResponse = {
        senders: [
          {
            _id: sender._id.toString(),
            fullname: sender.fullname,
            avatar: sender.avatar,
          },
        ],
        message,
        entityId: postId,
        entityType: EEntityType.POST,
        type: ENotificationType.POST_TAG,
        seen: false,
        isRead: false,
        total: 1,
        notificationId: notifications[0]._id.toString() || '',
        latestAt: new Date(),
      };
      client.to(userIds).emit(NOTIFICATION_MESSAGE.RESPONSE, data);
    } catch (error) {
      console.log('postTagNotification error', error);
      return;
    }
  }
}
