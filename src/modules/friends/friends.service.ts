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
      this.userModel.updateOne({ _id: user._id }, { $push: { following: userIdB } }),
      this.userModel.updateOne({ _id: userIdB }, { $push: { followers: user._id } }),
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
      this.userModel.updateOne({ _id: user._id }, { $push: { friends: fromUserId, following: user._id } }),
      this.userModel.updateOne({ _id: fromUserId }, { $push: { friends: user._id, followers: user._id } }),
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
      this.friendShipModel.findOne({ users: { $all: [userIdB, user._id] } }).lean(),
    ]);

    if (!existUser || !friendShip) {
      throw new BadRequestException('User or friend request not found');
    }

    await this.friendShipModel.deleteOne({ _id: friendShip._id });

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
      this.userModel.updateOne({ _id: user._id }, { $pull: { friends: userIdB, following: userIdB } }),
      this.userModel.updateOne({ _id: userIdB }, { $pull: { friends: user._id, followers: user._id } }),
    ]);

    return 'unfriend successfully';
  }

  async getFriends(userIdB: string, user: IUser) {
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
}
