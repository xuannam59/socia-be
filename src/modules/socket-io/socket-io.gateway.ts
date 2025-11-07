import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { IUser } from '@social/types/users.type';
import { UsersService } from '@social/users/users.service';
import { CONVERSATION_MESSAGE, SOCKET_CONFIG } from '@social/utils/socket';
import { Socket } from 'socket.io';

@WebSocketGateway(SOCKET_CONFIG)
export class SocketIoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly usersService: UsersService) {}

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
}
