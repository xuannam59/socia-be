import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from '@social/types/users.type';
import mongoose, { Model } from 'mongoose';
import { CreateConversationDto, IdOrCreateConversationDto } from './dto/create-conversation.dto';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import {
  AddMembersToConversationDto,
  GrantAdminDto,
  RemoveMemberFromConversationDto,
  RevokeAdminDto,
} from './dto/update-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(@InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>) {}

  async createGroupConversation(createConversationDto: CreateConversationDto, user: IUser) {
    const { userIds, name, avatar } = createConversationDto;
    const members = [...userIds, user._id];

    const newConversation = await this.conversationModel.create({
      users: members,
      name,
      avatar,
      usersState: members.map(member => ({ user: member, readLastMessage: null })),
      isGroup: true,
      admins: [user._id],
      seen: [user._id],
      lastMessageAt: new Date(),
    });
    return newConversation;
  }

  async findAll(query: any, user: IUser) {
    const pageNumber = query.page ? Number(query.page) : 1;
    const limitNumber = query.limit ? Number(query.limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter: any = {
      users: { $in: [user._id] },
      $or: [{ lastMessage: { $ne: null } }, { isGroup: true }],
    };

    const [conversations, total] = await Promise.all([
      this.conversationModel
        .find(filter)
        .skip(skip)
        .limit(limitNumber)
        .populate('lastMessage', 'content type sender')
        .populate('users', 'fullname avatar isOnline lastActive')
        .sort({ lastMessageAt: -1 })
        .lean(),
      this.conversationModel.countDocuments(filter),
    ]);
    const newConversations = conversations.map(conversation => {
      let name = conversation.name;
      let avatar = conversation.avatar;
      if (!conversation.isGroup) {
        const users = conversation.users as unknown as IUser[];
        const otherUser = users.find(other => other._id.toString() !== user._id);
        name = otherUser?.fullname || 'Người dùng';
        avatar = otherUser?.avatar || '';
      }
      return {
        ...conversation,
        name,
        avatar,
        isExist: true,
      };
    });
    return {
      list: newConversations,
      meta: { total },
    };
  }

  async getUnSeenConversations(user: IUser) {
    const unSeenConversations = await this.conversationModel
      .find({
        users: { $in: [user._id] },
        seen: { $ne: user._id },
        lastMessage: { $ne: null },
      })
      .select('_id');
    return unSeenConversations.map(conversation => conversation._id);
  }

  async getIdOrCreate(payload: IdOrCreateConversationDto) {
    const { userIds, isGroup } = payload;
    if (userIds.length !== 2) {
      return null;
    }
    if (!mongoose.Types.ObjectId.isValid(userIds[0]) || !mongoose.Types.ObjectId.isValid(userIds[1])) {
      throw new BadRequestException('Invalid user ids');
    }
    const conversation = await this.conversationModel
      .findOne({ users: { $all: userIds }, isGroup: isGroup })
      .populate('lastMessage', 'content type sender')
      .lean();
    if (conversation) {
      return conversation;
    }
    const usersState = userIds.map(userId => ({ user: userId, readLastMessage: null }));
    const newConversation = await this.conversationModel.create({
      users: userIds,
      usersState,
    });
    return newConversation;
  }

  async updateSeen(conversationIds: string[], user: IUser) {
    await this.conversationModel.updateMany(
      { _id: { $in: conversationIds }, seen: { $ne: user._id } },
      { $push: { seen: user._id } },
    );

    return 'update seen success';
  }

  async readConversation(conversationId: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversation id');
    }
    const existingConversation = await this.conversationModel.findOne({ _id: conversationId }).lean();
    if (!existingConversation) {
      throw new BadRequestException('Conversation not found');
    }
    const usersState = existingConversation.usersState.find(state => state.user === user._id);
    if (!usersState || usersState.readLastMessage === existingConversation.lastMessage) {
      return 'conversation already read';
    }
    await this.conversationModel.updateOne(
      { _id: existingConversation._id, 'usersState.user': user._id },
      { $addToSet: { seen: user._id }, $set: { 'usersState.$.readLastMessage': existingConversation.lastMessage } },
    );
    return 'update seen success';
  }

  async getGroupConversations(user: IUser) {
    const filter: any = {
      users: { $in: [user._id] },
      isGroup: true,
    };
    const conversations = await this.conversationModel
      .find(filter)
      .populate('lastMessage', 'content type sender')
      .populate('users', 'fullname avatar isOnline lastActive')
      .limit(10)
      .sort({ lastMessageAt: -1 })
      .lean();

    const newConversations = conversations.map(conversation => ({
      ...conversation,
      isExist: true,
    }));
    return newConversations;
  }

  async addMembersToConversation(payload: AddMembersToConversationDto, user: IUser) {
    const { userIds, conversationId } = payload;

    console.log(conversationId);
    console.log(userIds);
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversation id');
    }
    const existingConversation = await this.conversationModel.findOne({ _id: conversationId }).lean();
    if (!existingConversation) {
      throw new BadRequestException('Conversation not found');
    }

    if (!existingConversation.isGroup) {
      throw new BadRequestException('Conversation is not a group');
    }

    if (existingConversation.users.some(userId => userIds.includes(userId))) {
      throw new BadRequestException('Some users already in conversation');
    }

    if (!existingConversation.admins.includes(user._id)) {
      throw new BadRequestException('You are not an admin of this conversation');
    }

    const newMembers = userIds.map(userId => ({ user: userId, readLastMessage: null }));
    const newUsersState = [...existingConversation.usersState, ...newMembers];
    const newUsers = [...existingConversation.users, ...userIds];
    await this.conversationModel.updateOne(
      { _id: existingConversation._id },
      { $set: { usersState: newUsersState, users: newUsers } },
    );
    return 'Members added to conversation successfully';
  }

  async removeMemberFromConversation(payload: RemoveMemberFromConversationDto, user: IUser) {
    const { userId, conversationId } = payload;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversation id');
    }
    const existingConversation = await this.conversationModel.findOne({ _id: conversationId }).lean();
    if (!existingConversation) {
      throw new BadRequestException('Conversation not found');
    }

    if (!existingConversation.isGroup) {
      throw new BadRequestException('Conversation is not a group');
    }

    if (!existingConversation.admins.includes(user._id)) {
      throw new BadRequestException('You are not an admin of this conversation');
    }

    if (!existingConversation.users.includes(userId)) {
      throw new BadRequestException('User is not in this conversation');
    }

    const newUsersState = existingConversation.usersState.filter(state => state.user !== userId);
    const newUsers = existingConversation.users.filter(user => user !== userId);
    await this.conversationModel.updateOne(
      { _id: existingConversation._id },
      { $set: { usersState: newUsersState, users: newUsers } },
    );
    return 'Member removed from conversation successfully';
  }

  async grantAdmin(payload: GrantAdminDto, user: IUser) {
    const { userId, conversationId } = payload;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversation id');
    }
    const existingConversation = await this.conversationModel.findOne({ _id: conversationId }).lean();
    if (!existingConversation) {
      throw new BadRequestException('Conversation not found');
    }

    if (!existingConversation.isGroup) {
      throw new BadRequestException('Conversation is not a group');
    }

    if (existingConversation.admins.includes(userId)) {
      throw new BadRequestException('User is already an admin of this conversation');
    }

    if (!existingConversation.admins.includes(user._id)) {
      throw new BadRequestException('You are not an admin of this conversation');
    }

    if (!existingConversation.users.includes(userId)) {
      throw new BadRequestException('User is not in this conversation');
    }

    await this.conversationModel.updateOne({ _id: existingConversation._id }, { $addToSet: { admins: userId } });
    return 'Admin granted successfully';
  }

  async revokeAdmin(payload: RevokeAdminDto, user: IUser) {
    const { userId, conversationId } = payload;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversation id');
    }
    const existingConversation = await this.conversationModel.findOne({ _id: conversationId }).lean();
    if (!existingConversation) {
      throw new BadRequestException('Conversation not found');
    }

    if (!existingConversation.isGroup) {
      throw new BadRequestException('Conversation is not a group');
    }

    if (!existingConversation.admins.includes(user._id)) {
      throw new BadRequestException('You are not an admin of this conversation');
    }

    if (!existingConversation.admins.includes(userId)) {
      throw new BadRequestException('User is not an admin of this conversation');
    }

    await this.conversationModel.updateOne({ _id: existingConversation._id }, { $pull: { admins: userId } });
    return 'Admin revoked successfully';
  }
}
