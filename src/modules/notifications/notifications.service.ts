import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from './schemas/notification.schema';
import { Model, PipelineStage } from 'mongoose';
import { IUser } from '@social/types/users.type';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private notificationModel: Model<Notification>) {}

  async getGroupedNotifications(user: IUser, query: any) {
    const pageNumber = query.page ? Number(query.page) : 1;
    const limitNumber = query.limit ? Number(query.limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const pipeline = [
      { $match: { receiverId: user._id } },
      {
        $lookup: {
          from: 'users',
          let: { senderId: { $toObjectId: '$senderId' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$senderId'] },
              },
            },
          ],
          as: 'senderInfo',
        },
      },
      {
        $unwind: {
          path: '$senderInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: { receiverId: '$receiverId', type: '$type', entityId: '$entityId' },
          message: { $last: '$message' },
          senders: {
            $addToSet: {
              _id: '$senderId',
              fullname: '$senderInfo.fullname',
              avatar: '$senderInfo.avatar',
            },
          },
          total: { $sum: 1 },
          isRead: { $last: '$isRead' },
          seen: { $last: '$seen' },
          notificationId: { $first: '$_id' },
          latestAt: { $max: '$createdAt' },
        },
      },
      {
        $project: {
          _id: 0,
          receiverId: '$_id.receiverId',
          type: '$_id.type',
          entityId: '$_id.entityId',
          message: 1,
          senders: 1,
          total: 1,
          isRead: 1,
          seen: 1,
          latestAt: 1,
          notificationId: 1,
        },
      },
      { $sort: { latestAt: -1 } },
      { $skip: skip },
      { $limit: limitNumber },
    ] as PipelineStage[];

    const countPipeline = [
      { $match: { receiverId: user._id } },
      {
        $group: {
          _id: { receiverId: '$receiverId', type: '$type', entityId: '$entityId' },
        },
      },
      { $count: 'totalGroups' },
    ] as PipelineStage[];

    const [notifications, totalNotifications] = await Promise.all([
      this.notificationModel.aggregate(pipeline).exec(),
      this.notificationModel.aggregate(countPipeline).exec(),
    ]);

    return {
      list: notifications,
      meta: {
        total: totalNotifications[0]?.totalGroups || 0,
        page: pageNumber,
        limit: limitNumber,
      },
    };
  }

  async getUnSeenNotifications(user: IUser) {
    const pipeline = [
      { $match: { receiverId: user._id, seen: false } },
      {
        $group: {
          _id: { type: '$type', entityId: '$entityId' },
          notificationIds: { $first: '$_id' },
        },
      },
      { $project: { _id: 0, notificationIds: 1 } },
    ] as PipelineStage[];
    const notifications = await this.notificationModel.aggregate(pipeline).exec();
    const notificationIds = notifications.map(notification => notification.notificationIds);
    return notificationIds;
  }
}
