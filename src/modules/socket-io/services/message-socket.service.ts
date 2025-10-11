import { BadRequestException, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Message } from 'src/modules/messages/schemas/message.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from 'src/modules/notifications/schemas/notification.schema';
import { IMessageReaction, IMessageTyping, ISendMessage } from '@social/types/messages.type';
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
    const { _id: tempId, conversationId, sender, type, content, mentions, userLiked, parentId } = payload;
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

      const now = new Date();
      const newMessage = await this.messageModel.create({
        conversationId,
        sender: sender._id,
        type,
        content,
        mentions,
        userLiked,
        parentId: parentId ? parentId._id : null,
        timeEdited: new Date(now.getTime() + 15 * 60 * 1000),
      });
      await this.conversationModel.updateOne(
        { _id: conversationId },
        { lastMessage: newMessage._id, lastMessageAt: new Date() },
      );
      server.to(conversationId).emit(CHAT_MESSAGE.SEND, {
        ...newMessage.toObject(),
        parentId: parentId,
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

  async messageTyping(server: Server, payload: IMessageTyping) {
    try {
      const { conversationId, sender, status } = payload;
      const existingConversation = await this.conversationModel.findOne({ _id: conversationId });
      if (!existingConversation) {
        return;
      }
      server.to(conversationId).emit(CHAT_MESSAGE.TYPING, {
        conversationId,
        sender,
        status,
      });
    } catch (error) {
      console.log('typing error', error);
    }
  }

  async messageReaction(server: Server, payload: IMessageReaction) {
    const { conversationId, messageId, userId, type, isLike } = payload;
    try {
      if (
        !mongoose.Types.ObjectId.isValid(conversationId) ||
        !mongoose.Types.ObjectId.isValid(messageId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        throw new BadRequestException('Invalid message ID');
      }

      if (isLike) {
        const result = await this.messageModel.updateOne(
          { _id: messageId, 'userLikes.userId': userId, conversationId },
          { $set: { 'userLikes.$.type': type } },
        );

        if (result.modifiedCount === 0) {
          await this.messageModel.updateOne(
            { _id: messageId, conversationId },
            { $push: { userLikes: { userId, type } } },
          );
        }
      } else {
        await this.messageModel.updateOne({ _id: messageId, conversationId }, { $pull: { userLikes: { userId } } });
      }

      server.to(conversationId).emit(CHAT_MESSAGE.REACTION, {
        messageId,
        userId,
        type,
        isLike,
        status: 'success',
      });
    } catch (error) {
      console.log('reaction error', error);
      server.to(conversationId).emit(CHAT_MESSAGE.STATUS_MESSAGE, {
        messageId,
        userId,
        type,
        isLike,
        status: 'failed',
        message: 'Reaction failed',
      });
      return;
    }
  }
}
