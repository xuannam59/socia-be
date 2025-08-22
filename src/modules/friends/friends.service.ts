import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { FriendShip, FriendShipDocument } from './schemas/friend-ship.schema';
import type { IUser } from '@social/types/users.type';
import { FriendRequest, FriendRequestDocument } from './schemas/friend-request.schema';
import { User, UserDocument } from '@social/users/schemas/user.schema';

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(FriendShip.name) private friendShipModel: Model<FriendShipDocument>,
    @InjectModel(FriendRequest.name) private friendRequestModel: Model<FriendRequestDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createFriendRequest(toUserId: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(toUserId)) {
      throw new BadRequestException('Invalid user id');
    }

    if (toUserId === user._id) {
      throw new BadRequestException('You cannot send friend request to yourself');
    }

    const [existUser, existFriendRequest] = await Promise.all([
      this.userModel.findById(toUserId),
      this.friendRequestModel.findOne({
        $or: [
          { fromUserId: user._id, toUserId },
          { fromUserId: toUserId, toUserId: user._id },
        ],
        status: 'pending',
      }),
    ]);
    if (!existUser) {
      throw new BadRequestException('User not found');
    }

    if (existFriendRequest) {
      throw new BadRequestException('Friend request already exists');
    }

    const friendRequest = await this.friendRequestModel.create({
      fromUserId: user._id,
      toUserId,
      status: 'pending',
    });
    return {
      _id: friendRequest._id,
    };
  }

  async acceptFriendRequest(fromUserId: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(fromUserId)) {
      throw new BadRequestException('Invalid user id');
    }

    if (fromUserId === user._id) {
      throw new BadRequestException('You cannot accept friend request from yourself');
    }

    const [existUser, existFriendRequest] = await Promise.all([
      this.userModel.findById(fromUserId),
      this.friendRequestModel.findOne({
        fromUserId,
        toUserId: user._id,
        status: 'pending',
      }),
    ]);
    if (!existUser) {
      throw new BadRequestException('User not found');
    }

    if (!existFriendRequest) {
      throw new BadRequestException('Friend request not found');
    }
    return existFriendRequest.toObject();
  }
}
