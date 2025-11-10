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
  INotificationPostComment,
  INotificationCommentMention,
  INotificationCommentReply,
  INotificationStoryReaction,
} from '@social/types/notifications.type';
import { convertCommentMention } from '@social/utils/common';

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
      const existingNotifications = await this.notificationModel
        .find({
          entityType: EEntityType.POST,
          entityId: postId,
          type: ENotificationType.POST_TAG,
        })
        .select('receiverId')
        .lean();
      let userIds = userTags.map(user => user._id);

      if (existingNotifications.length > 0) {
        const receiverIds = existingNotifications.map(notification => notification.receiverId);
        for (const receiverId of receiverIds) {
          userIds = userIds.filter(userId => userId !== receiverId);
        }
      }

      if (userIds.length === 0) return;

      const notifications = await this.notificationModel.insertMany(
        userIds.map(userId => ({
          senderIds: [sender._id],
          receiverId: userId,
          type: ENotificationType.POST_TAG,
          entityType: EEntityType.POST,
          entityId: postId,
          message,
          latestAt: new Date(),
        })),
      );

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
          { $addToSet: { senderIds: userInfo._id }, latestAt: new Date() },
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
          latestAt: new Date(),
        });
        data._id = notification._id.toString();
      }
      client.to(creatorId).emit(NOTIFICATION_MESSAGE.RESPONSE, data);
    } catch (error) {
      console.log('postLikeNotification error', error);
      return;
    }
  }

  async postCommentNotification(client: Socket, payload: INotificationPostComment) {
    try {
      const { postId, postAuthorId, content, commentId, mentionsList, commentAuthorId } = payload;
      const message = convertCommentMention(content);
      const userInfo = client.data.user;
      if (postAuthorId !== userInfo._id) {
        const existingNotificationComment = await this.notificationModel
          .findOne({
            entityType: EEntityType.POST,
            entityId: postId,
            receiverId: postAuthorId,
            type: ENotificationType.POST_COMMENT,
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
          subEntityId: commentId,
          entityType: EEntityType.POST,
          type: ENotificationType.POST_COMMENT,
          seen: false,
          isRead: false,
        };
        if (existingNotificationComment) {
          const senders = existingNotificationComment.senderIds as unknown as INotificationResponse['senderIds'];
          const senderIds = senders.filter(sender => sender._id.toString() !== userInfo._id).map(sender => sender._id);
          const senderIdSet = new Set(senderIds);
          senderIdSet.add(userInfo._id);
          const result = await this.notificationModel.updateOne(
            { _id: existingNotificationComment._id },
            { senderIds: [...senderIdSet], message, latestAt: new Date(), subEntityId: commentId },
          );
          if (result.modifiedCount > 0) {
            data._id = existingNotificationComment._id.toString();
            const existingSenderIds = senders.filter(sender => sender._id.toString() !== userInfo._id);
            data.senderIds = [...existingSenderIds, ...data.senderIds];
          }
        } else {
          const notificationComment = await this.notificationModel.create({
            senderIds: [userInfo._id],
            receiverId: postAuthorId,
            type: ENotificationType.POST_COMMENT,
            entityType: EEntityType.POST,
            entityId: postId,
            subEntityId: commentId,
            message,
            latestAt: new Date(),
          });
          data._id = notificationComment._id.toString();
        }
        client.to(postAuthorId).emit(NOTIFICATION_MESSAGE.RESPONSE, data);
      }

      const userIds = new Set(mentionsList);
      userIds.delete(postAuthorId);
      userIds.delete(commentAuthorId || '');
      if (userIds.size > 0) {
        await this.postCommentMentionNotification(client, {
          postId,
          commentId,
          userIds: Array.from(userIds),
          message,
        });
      }

      if (commentAuthorId && commentAuthorId !== userInfo._id) {
        await this.postCommentReplyNotification(client, {
          postId,
          commentId,
          message,
          commentAuthorId,
        });
      }
      return;
    } catch (error) {
      console.log('postCommentNotification error', error);
      return;
    }
  }

  async postCommentMentionNotification(client: Socket, payload: INotificationCommentMention) {
    try {
      const { postId, commentId, userIds, message } = payload;
      const userInfo = client.data.user;
      const notifications = await this.notificationModel.insertMany(
        userIds.map(userId => ({
          senderIds: [userInfo._id],
          receiverId: userId,
          type: ENotificationType.COMMENT_MENTION,
          entityType: EEntityType.POST,
          entityId: postId,
          subEntityId: commentId,
          message,
          latestAt: new Date(),
        })),
      );
      if (notifications.length === 0) return;
      const data: INotificationResponse = {
        _id: new Date().getTime().toString(),
        senderIds: [
          {
            _id: userInfo._id,
            fullname: userInfo.fullname,
            avatar: userInfo.avatar,
          },
        ],
        message,
        entityId: postId,
        subEntityId: commentId,
        entityType: EEntityType.POST,
        type: ENotificationType.COMMENT_MENTION,
        seen: false,
        isRead: false,
      };
      client.to(userIds).emit(NOTIFICATION_MESSAGE.RESPONSE, data);
      return;
    } catch (error) {
      console.log('postCommentMentionNotification error', error);
      return;
    }
  }

  async postCommentReplyNotification(client: Socket, payload: INotificationCommentReply) {
    try {
      const { postId, commentId, message, commentAuthorId } = payload;
      const userInfo = client.data.user;
      const notification = await this.notificationModel.create({
        senderIds: [userInfo._id],
        receiverId: commentAuthorId,
        type: ENotificationType.COMMENT_REPLY,
        entityType: EEntityType.POST,
        entityId: postId,
        subEntityId: commentId,
        message,
        latestAt: new Date(),
      });
      const data: INotificationResponse = {
        _id: notification._id.toString(),
        senderIds: [
          {
            _id: userInfo._id,
            fullname: userInfo.fullname,
            avatar: userInfo.avatar,
          },
        ],
        message,
        entityId: postId,
        subEntityId: commentId,
        entityType: EEntityType.POST,
        type: ENotificationType.COMMENT_REPLY,
        seen: false,
        isRead: false,
      };
      client.to(commentAuthorId).emit(NOTIFICATION_MESSAGE.RESPONSE, data);
    } catch (error) {
      console.log('postCommentReplyNotification error', error);
      return;
    }
  }

  async storyReactionNotification(client: Socket, payload: INotificationStoryReaction) {
    try {
      const { storyId, authorId } = payload;
      const userInfo = client.data.user;

      const existingNotification = await this.notificationModel
        .findOne({
          entityType: EEntityType.STORY,
          entityId: storyId,
          receiverId: authorId,
          type: ENotificationType.STORY_REACTION,
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
        message: '',
        entityId: storyId,
        entityType: EEntityType.STORY,
        type: ENotificationType.STORY_REACTION,
        seen: false,
        isRead: false,
      };

      if (existingNotification) {
        const result = await this.notificationModel.updateOne(
          { _id: existingNotification._id, senderIds: { $ne: userInfo._id } },
          { $addToSet: { senderIds: userInfo._id }, latestAt: new Date() },
        );
        const senders = existingNotification.senderIds as unknown as INotificationResponse['senderIds'];
        if (result.modifiedCount > 0) {
          data._id = existingNotification._id.toString();
          data.senderIds = [...senders, ...data.senderIds];
        }
      } else {
        const notification = await this.notificationModel.create({
          senderIds: [userInfo._id],
          receiverId: authorId,
          type: ENotificationType.STORY_REACTION,
          entityType: EEntityType.STORY,
          entityId: storyId,
          message: '',
          latestAt: new Date(),
        });
        data._id = notification._id.toString();
      }
      client.to(authorId).emit(NOTIFICATION_MESSAGE.RESPONSE, data);
    } catch (error) {
      console.log('storyReactionNotification error', error);
      return;
    }
  }
}
