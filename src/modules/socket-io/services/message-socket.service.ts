import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Message } from 'src/modules/messages/schemas/message.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from 'src/modules/notifications/schemas/notification.schema';
import { ISendMessage } from '@social/types/messages.type';
import { Conversation } from 'src/modules/conversations/schemas/conversation.schema';
import { CHAT_MESSAGE } from '@social/utils/socket';

@Injectable()
export class MessageSocketService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
  ) {}

  async sendMessage(server: Server, client: Socket, payload: ISendMessage) {
    const { _id: tempId, conversationId, sender, type, content, mentions, userLiked, status } = payload;
    try {
      const existingConversation = await this.conversationModel.findOne({ _id: conversationId });
      if (!existingConversation) {
        server.to(conversationId).emit(CHAT_MESSAGE.STATUS_MESSAGE, {
          tempId,
          conversationId,
          senderId: sender._id,
          status: 'failed',
          message: 'Conversation not found',
        });
        return;
      }
      const newMessage = await this.messageModel.create({
        conversationId,
        sender: sender._id,
        type,
        content,
        mentions,
        userLiked,
      });
      await this.conversationModel.updateOne(
        { _id: conversationId },
        { lastMessage: newMessage._id, lastMessageAt: new Date() },
      );
      server.to(conversationId).emit(CHAT_MESSAGE.RECEIVE, {
        ...newMessage.toObject(),
        sender: {
          _id: newMessage.sender,
          fullname: sender.fullname,
          avatar: sender.avatar,
        },
        status: 'success',
        tempId,
      });
    } catch (error) {
      server.to(conversationId).emit(CHAT_MESSAGE.STATUS_MESSAGE, {
        tempId,
        conversationId,
        senderId: sender._id,
        status: 'failed',
        message: 'Send message failed',
      });
      console.log('sendMessage error', error);
      return;
    }
  }

  async typing(client: Socket, payload: any) {
    try {
      const { conversationId, sender, type, content, mentions, userLiked, status } = payload;
    } catch (error) {
      console.log('typing error', error);
    }
  }
}
