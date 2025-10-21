import { Module } from '@nestjs/common';
import { SocketIoGateway } from './socket-io.gateway';
import { AuthsModule } from '../auths/auths.module';
import { UsersModule } from '../users/users.module';
import { MessageSocketService } from './services/message-socket.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../messages/schemas/message.schema';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.schema';
import { Conversation, ConversationSchema } from '../conversations/schemas/conversation.schema';
import { NotificationsSocketModule } from './notifications/notifications-socket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    AuthsModule,
    UsersModule,
    NotificationsSocketModule,
  ],
  providers: [SocketIoGateway, MessageSocketService],
})
export class SocketIoModule {}
