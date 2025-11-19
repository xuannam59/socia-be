import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from './schemas/notification.schema';
import mongoose, { Model } from 'mongoose';
import { IUser } from '@social/types/users.type';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private notificationModel: Model<Notification>) {}

  async getGroupedNotifications(user: IUser, query: any) {
    const pageNumber = query.page ? Number(query.page) : 1;
    const limitNumber = query.limit ? Number(query.limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {
      receiverId: user._id,
    };

    const [notifications, totalNotifications] = await Promise.all([
      this.notificationModel
        .find(filter)
        .populate('senderIds', 'fullname avatar')
        .sort({ latestAt: -1 })
        .limit(limitNumber)
        .skip(skip)
        .lean(),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.updateMany({ receiverId: user._id, seen: false }, { $set: { seen: true } }),
    ]);

    return {
      list: notifications,
      meta: {
        total: totalNotifications || 0,
        page: pageNumber,
        limit: limitNumber,
      },
    };
  }

  async getUnSeenNotifications(user: IUser) {
    const filter = {
      receiverId: user._id,
      seen: false,
    };

    const notifications = await this.notificationModel.find(filter).select('_id').lean();
    return notifications.map(notification => notification._id);
  }

  async readNotifications(notificationId: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new BadRequestException('Invalid notification id');
    }
    await this.notificationModel.updateOne({ _id: notificationId, receiverId: user._id }, { $set: { isRead: true } });
    return 'update read success';
  }

  async seenNotifications(user: IUser) {
    await this.notificationModel.updateMany({ receiverId: user._id, seen: false }, { $set: { seen: true } });
    return 'update seen success';
  }
}
