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
  INotificationPostLike,
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

      const notifications = await this.notificationModel.insertMany(
        userTags.map(user => ({
          senderIds: [sender._id],
          receiverId: user._id,
          type: ENotificationType.POST_TAG,
          entityType: EEntityType.POST,
          entityId: postId,
          message,
        })),
      );
      const userIds = userTags.map(user => user._id);
      const data: INotificationResponse = {
        _id: notifications[0]._id.toString(),
        senderIds: [
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
      };
      client.to(userIds).emit(NOTIFICATION_MESSAGE.RESPONSE, data);
    } catch (error) {
      console.log('postTagNotification error', error);
      return;
    }
  }

  async postLikeNotification(client: Socket, payload: INotificationPostLike) {
    try {
      const { postId, creatorId, message } = payload;
      const userInfo = client.data.user;

      const existingNotification = await this.notificationModel
        .findOne({
          entityType: EEntityType.POST,
          entityId: postId,
          receiverId: creatorId,
          type: ENotificationType.POST_LIKE,
        })
        .populate('senderIds', 'fullname avatar')
        .lean();

      const data: INotificationResponse = {
        _id: '',
        senderIds: [
          {
            _id: userInfo._id,
            fullname: userInfo.fullname,
            avatar: userInfo.avatar,
          },
        ],
        message,
        entityId: postId,
        entityType: EEntityType.POST,
        type: ENotificationType.POST_LIKE,
        seen: false,
        isRead: false,
      };

      if (existingNotification) {
        const result = await this.notificationModel.updateOne(
          { _id: existingNotification._id, senderIds: { $ne: userInfo._id } },
          { $addToSet: { senderIds: userInfo._id } },
        );
        const senders = existingNotification.senderIds as unknown as INotificationResponse['senderIds'];
        if (result.modifiedCount > 0) {
          data._id = existingNotification._id.toString();
          data.senderIds = [...senders, ...data.senderIds];
        }
      } else {
        const notification = await this.notificationModel.create({
          senderIds: [userInfo._id],
          receiverId: creatorId,
          type: ENotificationType.POST_LIKE,
          entityType: EEntityType.POST,
          entityId: postId,
          message,
        });
        data._id = notification._id.toString();
      }
      client.to(creatorId).emit(NOTIFICATION_MESSAGE.RESPONSE, data);
    } catch (error) {
      console.log('postLikeNotification error', error);
      return;
    }
  }
}
