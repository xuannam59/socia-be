import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageSocketService } from './services/message-socket.service';
import { UsersService } from '@social/users/users.service';
import { CONVERSATION_MESSAGE } from '@social/utils/socket';
import { CHAT_MESSAGE } from '@social/utils/socket';
import { IUser } from '@social/types/users.type';
import { SOCKET_CONFIG } from '@social/utils/socket';
import type {
  IMessageEdit,
  IMessageReaction,
  IMessageRevoke,
  IMessageTyping,
  ISendMessage,
} from '@social/types/messages.type';

@WebSocketGateway(SOCKET_CONFIG)
export class SocketIoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly messageSocketService: MessageSocketService,
    private readonly usersService: UsersService,
  ) {}

  @WebSocketServer()
  private server: Server;

  private userMaps = new Map<string, string>();

  async handleConnection(client: Socket) {
    try {
      const userInfo = client.handshake.auth.userInfo as IUser;

      await this.usersService.updateUserOnlineStatus(userInfo._id, true);
      client.data.user = userInfo;
      client.join(userInfo._id);
      this.userMaps.set(client.id, userInfo._id);
    } catch (error) {
      client.disconnect();
    }
    return;
  }

  async handleDisconnect(client: Socket) {
    try {
      const user = client.data.user;
      if (user && user._id) {
        await this.usersService.updateUserOnlineStatus(user._id, false);
        client.leave(user._id);
        this.userMaps.delete(client.id);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  @SubscribeMessage(CONVERSATION_MESSAGE.JOIN)
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
    const clientId = this.userMaps.get(client.id);
    if (!clientId) {
      return;
    }
    client.join(conversationId);
    return;
  }

  @SubscribeMessage(CONVERSATION_MESSAGE.LEAVE)
  async handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
    const clientId = this.userMaps.get(client.id);
    if (!clientId) {
      return;
    }
    client.leave(conversationId);
    return;
  }

  @SubscribeMessage(CHAT_MESSAGE.SEND)
  async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: ISendMessage) {
    // const socketIds = await this.server.in(payload.conversationId).allSockets();
    // const userOnline = socketIds.forEach(socketId => {
    //   const user = this.userMaps.get(socketId);
    //   if (user) {
    //     return user;
    //   }
    // });
    return this.messageSocketService.sendMessage(this.server, client, payload);
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
}
