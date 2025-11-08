import { BadRequestException, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Message } from 'src/modules/messages/schemas/message.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  IMessageEdit,
  IMessageReaction,
  IMessageReadByUser,
  IMessageReplyStory,
  IMessageRevoke,
  IMessageTyping,
  ISendMessage,
} from '@social/types/messages.type';
import { Conversation } from 'src/modules/conversations/schemas/conversation.schema';
import { CHAT_MESSAGE, HEADER_MESSAGE } from '@social/utils/socket';
import { Story } from 'src/modules/stories/schemas/story.schema';

@Injectable()
export class MessageSocketService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(Story.name) private storyModel: Model<Story>,
  ) {}

  async sendMessage(server: Server, payload: ISendMessage) {
    const { _id: tempId, conversationId, sender, type, content, mentions, userLiked, parentId } = payload;
    try {
      const existingConversation = await this.conversationModel
        .findOne({ _id: conversationId })
        .populate('users', 'fullname avatar isOnline lastActive')
        .lean();
      if (!existingConversation) {
        server.to(conversationId).emit(CHAT_MESSAGE.SEND, {
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
      const usersState = existingConversation.usersState.map(user => {
        if (user.user === sender._id) {
          return { ...user, readLastMessage: newMessage._id.toString() };
        } else {
          return user;
        }
      });
      await this.conversationModel.updateOne(
        { _id: conversationId },
        { lastMessage: newMessage._id, lastMessageAt: new Date(), usersState, seen: [sender._id] },
      );

      const users = existingConversation.users.map((user: any) => user._id.toString());
      server.to(users).emit(HEADER_MESSAGE.UN_SEEN_CONVERSATION, {
        conversation: {
          ...existingConversation,
          usersState,
          lastMessage: {
            _id: newMessage._id,
            type,
            content,
            sender: sender._id,
          },
          lastMessageAt: new Date(),
          isExist: true,
        },
        senderId: sender._id,
      });
      server.to(conversationId).emit(CHAT_MESSAGE.SEND, {
        ...newMessage.toObject(),
        parentId: parentId,
        sender: {
          _id: newMessage.sender,
          fullname: sender.fullname,
          avatar: sender.avatar,
        },
        status: 'success',
        message: 'Message sent successfully',
        tempId,
      });
    } catch (error) {
      server.to(conversationId).emit(CHAT_MESSAGE.SEND, {
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
      server.to(conversationId).emit(CHAT_MESSAGE.REACTION, {
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

  async messageEdit(server: Server, payload: IMessageEdit) {
    const { conversationId, _id, sender, type, content, mentions, timeEdited } = payload;
    try {
      const existingMessage = await this.messageModel.findOne({ _id, conversationId });
      if (!existingMessage) {
        return;
      }
      const now = new Date().getTime();
      const expireTimeEdit = new Date(timeEdited).getTime() - now;
      if (expireTimeEdit <= 0) return;
      await this.messageModel.updateOne(
        { _id, conversationId },
        { $set: { content, edited: true, timeEdited: new Date(now + 15 * 60 * 1000) } },
      );
      server.to(conversationId).emit(CHAT_MESSAGE.EDIT, {
        _id,
        conversationId,
        sender,
        type,
        content,
        mentions,
        timeEdited,
      });
    } catch (error) {
      console.log('edit message error', error);
    }
  }

  async messageRevoke(server: Server, payload: IMessageRevoke) {
    const { conversationId, messageId, userId, content } = payload;
    try {
      const existingMessage = await this.messageModel.findOne({ _id: messageId, conversationId, revoked: false });
      if (!existingMessage) {
        server.to(conversationId).emit(CHAT_MESSAGE.REVOKE, {
          messageId,
          userId,
          content,
          status: 'failed',
          message: 'Message not found',
        });
        return;
      }
      await this.messageModel.updateOne(
        { _id: messageId, conversationId },
        { $set: { revoked: true, content: '', revokedContent: content } },
      );
      server.to(conversationId).emit(CHAT_MESSAGE.REVOKE, {
        messageId,
        userId,
        status: 'success',
      });
    } catch (error) {
      server.to(conversationId).emit(CHAT_MESSAGE.REVOKE, {
        messageId,
        userId,
        content,
        status: 'failed',
        message: 'Revoke message failed',
      });
      console.log('revoke message error', error);
    }
  }

  async messageRead(server: Server, payload: IMessageReadByUser) {
    const { conversationId, userId } = payload;
    try {
      const existingConversation = await this.conversationModel.findOne({ _id: conversationId });
      if (!existingConversation) {
        return;
      }
      const lastMessageId = existingConversation.lastMessage;
      const userState = existingConversation.usersState.find(state => state.user === userId);
      if (!userState || userState.readLastMessage === lastMessageId) {
        return;
      }
      await this.conversationModel.updateOne(
        { _id: conversationId, 'usersState.user': userId },
        { $set: { 'usersState.$.readLastMessage': lastMessageId }, $addToSet: { seen: userId } },
      );
      server.to(conversationId).emit(CHAT_MESSAGE.READ, {
        conversationId,
        userId,
        lastMessageId,
      });
    } catch (error) {
      console.log('read message error', error);
      return;
    }
  }

  async messageReplyStory(server: Server, client: Socket, payload: IMessageReplyStory) {
    const { receiver, content, storyId } = payload;
    const myInfo = client.data.user;
    try {
      // eslint-disable-next-line prefer-const
      let [conversation, story] = await Promise.all([
        this.conversationModel.findOne({ users: { $all: [receiver._id, myInfo._id] } }).lean(),
        this.storyModel.findOne({ _id: storyId }).select('content type media createdAt').lean(),
      ]);

      if (!story) {
        return;
      }

      if (!conversation) {
        conversation = await this.conversationModel.create({
          users: [receiver._id, myInfo._id],
          usersState: [
            { user: receiver._id, readLastMessage: null },
            { user: myInfo._id, readLastMessage: null },
          ],
        });
      }
      const newMessage = await this.messageModel.create({
        conversationId: conversation._id,
        sender: myInfo._id,
        type: 'text',
        content,
        storyId,
        mentions: [],
        userLiked: [],
      });
      const usersState = conversation.usersState.map(user => {
        if (user.user === myInfo._id) {
          return { ...user, readLastMessage: newMessage._id.toString() };
        } else {
          return user;
        }
      });
      await this.conversationModel.updateOne(
        { _id: conversation._id },
        { lastMessage: newMessage._id, lastMessageAt: new Date(), usersState, seen: [myInfo._id] },
      );
      server.to([receiver._id, myInfo._id]).emit(HEADER_MESSAGE.UN_SEEN_CONVERSATION, {
        conversation: {
          ...conversation,
          usersState,
          lastMessage: {
            _id: newMessage._id,
            type: 'text',
            content,
            sender: myInfo._id,
          },
          lastMessageAt: new Date(),
          isExist: true,
        },
        senderId: myInfo._id,
      });
      server.to(conversation._id.toString()).emit(CHAT_MESSAGE.SEND, {
        ...newMessage.toObject(),
        sender: {
          _id: newMessage.sender,
          fullname: myInfo.fullname,
          avatar: myInfo.avatar,
        },
        storyId: story,
        status: 'success',
        message: 'Message sent successfully',
      });
    } catch (error) {
      console.log('reply story error', error);
    }
  }
}
