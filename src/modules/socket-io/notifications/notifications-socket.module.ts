import { Module } from '@nestjs/common';
import { NotificationsSocketService } from './notifications-socket.service';
import { NotificationsSocketGateway } from './notifications-socket.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from 'src/modules/notifications/schemas/notification.schema';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]), UsersModule],
  providers: [NotificationsSocketGateway, NotificationsSocketService],
})
export class NotificationsSocketModule {}
