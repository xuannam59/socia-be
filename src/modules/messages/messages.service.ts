import { BadRequestException, Injectable } from '@nestjs/common';
import { Message } from './schemas/message.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

@Injectable()
export class MessagesService {
  constructor(@InjectModel(Message.name) private messageModel: Model<Message>) {}

  async fetchMessagesByConversationId(conversationId: string, query: any) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Conversation ID is invalid');
    }

    const pageNumber = query.page ? Number(query.page) : 1;
    const limitNumber = 15;
    const skip = (pageNumber - 1) * limitNumber;

    const [result, total] = await Promise.all([
      this.messageModel
        .find({ conversationId })
        .sort({ createdAt: -1 })
        .populate('sender', 'fullname avatar')
        .populate({
          path: 'parentId',
          select: 'content type',
          populate: {
            path: 'sender',
            select: 'fullname',
          },
        })
        .limit(limitNumber)
        .skip(skip)
        .lean(),
      this.messageModel.countDocuments({ conversationId }),
    ]);
    return { list: result, meta: { total } };
  }
}
