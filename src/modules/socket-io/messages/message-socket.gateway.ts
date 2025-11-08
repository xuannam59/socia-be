import { SubscribeMessage, WebSocketGateway, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';

import type {
  IMessageEdit,
  IMessageReadByUser,
  IMessageRevoke,
  IMessageReaction,
  IMessageTyping,
  ISendMessage,
  IMessageReplyStory,
} from '@social/types/messages.type';
import { CHAT_MESSAGE } from '@social/utils/socket';
import { MessageSocketService } from './message-socket.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class MessageSocketGateway {
  constructor(private readonly messageSocketService: MessageSocketService) {}

  @WebSocketServer()
  private server: Server;

  @SubscribeMessage(CHAT_MESSAGE.SEND)
  async handleSendMessage(@MessageBody() payload: ISendMessage) {
    return this.messageSocketService.sendMessage(this.server, payload);
  }

  @SubscribeMessage(CHAT_MESSAGE.TYPING)
  async handleTyping(@MessageBody() payload: IMessageTyping) {
    return this.messageSocketService.messageTyping(this.server, payload);
  }

  @SubscribeMessage(CHAT_MESSAGE.REACTION)
  async handleReaction(@MessageBody() payload: IMessageReaction) {
    return this.messageSocketService.messageReaction(this.server, payload);
  }

  @SubscribeMessage(CHAT_MESSAGE.EDIT)
  async handleEditMessage(@MessageBody() payload: IMessageEdit) {
    return this.messageSocketService.messageEdit(this.server, payload);
  }

  @SubscribeMessage(CHAT_MESSAGE.REVOKE)
  async handleRevokeMessage(@MessageBody() payload: IMessageRevoke) {
    return this.messageSocketService.messageRevoke(this.server, payload);
  }

  @SubscribeMessage(CHAT_MESSAGE.READ)
  async handleReadMessage(@MessageBody() payload: IMessageReadByUser) {
    return this.messageSocketService.messageRead(this.server, payload);
  }

  @SubscribeMessage(CHAT_MESSAGE.REPLY_STORY)
  async handleReplyStory(@ConnectedSocket() client: Socket, @MessageBody() payload: IMessageReplyStory) {
    return this.messageSocketService.messageReplyStory(this.server, client, payload);
  }
}
