import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { IUser } from '@social/types/users.type';

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

  async getIdOrCreate(userIds: string[]) {
    if (userIds.length !== 2) {
      return null;
    }
    if (!mongoose.Types.ObjectId.isValid(userIds[0]) || !mongoose.Types.ObjectId.isValid(userIds[1])) {
      throw new BadRequestException('Invalid user ids');
    }
    const conversation = await this.conversationModel
      .findOne({ users: { $all: userIds } })
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
}
