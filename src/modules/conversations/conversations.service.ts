import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

@Injectable()
export class ConversationsService {
  constructor(@InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>) {}

  create(createConversationDto: CreateConversationDto) {
    const { userIds, name, avatar, isGroup } = createConversationDto;
    return 'This action adds a new conversation';
  }

  findAll() {
    return `This action returns all conversations`;
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
      .select('_id')
      .lean();
    if (conversation) {
      return conversation._id;
    }
    const newConversation = await this.conversationModel.create({ users: userIds });
    return newConversation._id;
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
