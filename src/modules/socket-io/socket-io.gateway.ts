import { InjectModel } from '@nestjs/mongoose';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway } from '@nestjs/websockets';
import { User } from '@social/users/schemas/user.schema';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { SocketIoService } from './socket-io.service';
import { AuthsService } from '@social/auths/auths.service';
import { UsersService } from '@social/users/users.service';

@WebSocketGateway({ cors: true })
export class SocketIoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly socketIoService: SocketIoService,
    private readonly authsService: AuthsService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const user = this.authsService.handleVerifyToken(token);
      await this.usersService.updateUserOnlineStatus(user._id, true);
      client.data.user = user;
      client.join(user._id);
      console.log('connect...', client.id);
    } catch (error) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const user = client.data.user;
      await this.usersService.updateUserOnlineStatus(user._id, false);
      client.leave(user._id);
      console.log('disconnect...', client.id);
    } catch (error) {
      client.disconnect();
    }
  }
}
