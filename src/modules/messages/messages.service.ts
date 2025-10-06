import { BadRequestException, Injectable } from '@nestjs/common';
import { Message } from './schemas/message.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

@Injectable()
export class MessagesService {
  constructor(@InjectModel(Message.name) private messageModel: Model<Message>) {}

  async fetchMessagesByConversationId(conversationId: string) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Conversation ID is invalid');
    }
    return this.messageModel
      .find({ conversationId })
      .sort({ createdAt: -1 })
      .populate('sender', 'fullname avatar')
      .limit(15)
      .lean();
  }
}
