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

  create(createConversationDto: CreateConversationDto) {
    const { userIds, name, avatar, isGroup } = createConversationDto;
    return 'This action adds a new conversation';
  }

  async findAll(query: any, user: IUser) {
    const pageNumber = query.page ? Number(query.page) : 1;
    const limitNumber = query.limit ? Number(query.limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter: any = {
      users: { $in: [user._id] },
      lastMessage: { $ne: null },
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
      if (conversation.isGroup) {
        return conversation;
      }
      const users = conversation.users as unknown as IUser[];
      const otherUser = users.find(other => other._id.toString() !== user._id);
      console.log(user._id);
      console.log(otherUser);
      if (!otherUser) {
        return { ...conversation, isExist: true };
      }
      return { ...conversation, name: otherUser.fullname, avatar: otherUser.avatar, isExist: true };
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
    const conversation = await this.conversationModel.findOne({ users: { $all: userIds } }).lean();
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

  async updateReadAndSeen(conversationId: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversation id');
    }
    const existingConversation = await this.conversationModel.findOne({ _id: conversationId }).lean();
    if (!existingConversation) {
      throw new BadRequestException('Conversation not found');
    }

    await this.conversationModel.updateOne(
      { _id: conversationId, 'usersState.user': user._id },
      { $set: { 'usersState.$.readLastMessage': existingConversation.lastMessage }, $addToSet: { seen: user._id } },
    );
    return 'update read success';
  }

  findOne(id: number) {
    return `This action returns a #${id} conversation`;
  }

  update(id: number, updateConversationDto: UpdateConversationDto) {
    return `This action updates a #${id} conversation`;
  }

  remove(id: number) {
    return `This action removes a #${id} conversation`;
  }
}
