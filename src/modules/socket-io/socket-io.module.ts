import { Module } from '@nestjs/common';
import { SocketIoService } from './socket-io.service';
import { SocketIoGateway } from './socket-io.gateway';
import { AuthsModule } from '../auths/auths.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [AuthsModule, UsersModule],
  providers: [SocketIoGateway, SocketIoService],
})
export class SocketIoModule {}
