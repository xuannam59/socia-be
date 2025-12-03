import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { FriendShip, FriendShipDocument } from './schemas/friend-ship.schema';
import type { IUser } from '@social/types/users.type';
import { User, UserDocument } from '@social/users/schemas/user.schema';

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(FriendShip.name) private friendShipModel: Model<FriendShipDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createFriendRequest(userIdB: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(userIdB)) {
      throw new BadRequestException('Invalid user ID');
    }

    if (user._id === userIdB) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const [existingFriendShip, targetUser] = await Promise.all([
      this.friendShipModel.findOne({
        $or: [
          { fromUserId: user._id, toUserId: userIdB },
          { fromUserId: userIdB, toUserId: user._id },
        ],
      }),
      this.userModel.findById(userIdB).lean(),
    ]);

    if (!targetUser) {
      throw new BadRequestException('Target user not found');
    }

    if (existingFriendShip) {
      const statusMessage =
        existingFriendShip.status === 'pending' ? 'Friend request is already pending' : 'You are already friends';
      throw new BadRequestException(statusMessage);
    }

    const [friendShip] = await Promise.all([
      this.friendShipModel.create({
        fromUserId: user._id,
        toUserId: userIdB,
        users: [user._id, userIdB],
        status: 'pending',
      }),
      this.userModel.updateOne({ _id: user._id }, { $addToSet: { following: userIdB } }),
      this.userModel.updateOne({ _id: userIdB }, { $addToSet: { followers: user._id } }),
    ]);

    return friendShip.toObject();
  }

  async AcceptRequest(fromUserId: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(fromUserId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const [existUser, friendShip] = await Promise.all([
      this.userModel.findOne({ _id: fromUserId }).lean(),
      this.friendShipModel.findOne({ fromUserId: fromUserId, toUserId: user._id, status: 'pending' }).lean(),
    ]);

    if (!existUser || !friendShip) {
      throw new BadRequestException('User or friend request not found');
    }

    await Promise.all([
      this.friendShipModel.updateOne({ _id: friendShip._id }, { status: 'accepted' }),
      this.userModel.updateOne({ _id: user._id }, { $addToSet: { friends: fromUserId, following: fromUserId } }),
      this.userModel.updateOne({ _id: fromUserId }, { $addToSet: { friends: user._id, followers: user._id } }),
    ]);

    return {
      status: 'accepted',
    };
  }

  async rejectRequest(userIdB: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(userIdB)) {
      throw new BadRequestException('Invalid user ID');
    }

    const [existUser, friendShip] = await Promise.all([
      this.userModel.exists({ _id: userIdB }).lean(),
      this.friendShipModel.findOne({ users: { $all: [userIdB, user._id] }, status: 'pending' }).lean(),
    ]);

    if (!existUser || !friendShip) {
      throw new BadRequestException('User or friend request not found');
    }
    const promises: Promise<any>[] = [this.friendShipModel.deleteOne({ _id: friendShip._id })];

    if (user._id === friendShip.fromUserId) {
      promises.push(this.userModel.updateOne({ _id: user._id }, { $pull: { following: userIdB } }));
      promises.push(this.userModel.updateOne({ _id: userIdB }, { $pull: { followers: user._id } }));
    } else {
      promises.push(this.userModel.updateOne({ _id: user._id }, { $pull: { followers: userIdB } }));
      promises.push(this.userModel.updateOne({ _id: userIdB }, { $pull: { following: user._id } }));
    }

    await Promise.all(promises);

    return 'delete friend request successfully';
  }

  async unfriend(userIdB: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(userIdB)) {
      throw new BadRequestException('Invalid user ID');
    }

    const [existUser, friendShip] = await Promise.all([
      this.userModel.exists({ _id: userIdB }).lean(),
      this.friendShipModel.findOne({ users: { $all: [userIdB, user._id] }, status: 'accepted' }).lean(),
    ]);

    if (!existUser || !friendShip) {
      throw new BadRequestException('User or friend request not found');
    }

    await Promise.all([
      this.friendShipModel.deleteOne({ _id: friendShip._id }),
      this.userModel.updateOne(
        { _id: user._id },
        { $pull: { friends: userIdB, following: userIdB, followers: userIdB } },
      ),
      this.userModel.updateOne(
        { _id: userIdB },
        { $pull: { friends: user._id, following: user._id, followers: user._id } },
      ),
    ]);

    return 'unfriend successfully';
  }

  async getFriendStatus(userIdB: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(userIdB)) {
      throw new BadRequestException('Invalid user ID');
    }

    const [existUser, friendShip] = await Promise.all([
      this.userModel.exists({ _id: userIdB }).lean(),
      this.friendShipModel.findOne({ users: { $all: [userIdB, user._id] } }).lean(),
    ]);

    if (!existUser) {
      throw new BadRequestException('User not found');
    }

    return friendShip;
  }

  async getFriendList(_user: IUser) {
    void _user;
    return 'get friend list successfully';
  }

  async inviteFriend(user: IUser, query: any) {
    const { page, limit } = query;
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter: any = {
      toUserId: user._id,
      status: 'pending',
    };

    const [invitedUsers, total] = await Promise.all([
      this.friendShipModel
        .find(filter)
        .populate('fromUserId', 'fullname avatar')
        .sort({ createdAt: -1 })
        .limit(limitNumber)
        .skip(skip)
        .lean(),
      this.friendShipModel.countDocuments(filter),
    ]);

    return { list: invitedUsers, meta: { total } };
  }

  async requestSentList(user: IUser, query: any) {
    const { page, limit } = query;
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter: any = {
      fromUserId: user._id,
      status: 'pending',
    };

    const [requestSentUsers, total] = await Promise.all([
      this.friendShipModel
        .find(filter)
        .populate('toUserId', 'fullname avatar')
        .sort({ createdAt: -1 })
        .limit(limitNumber)
        .skip(skip)
        .lean(),
      this.friendShipModel.countDocuments(filter),
    ]);

    return { list: requestSentUsers, meta: { total } };
  }
}
