import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthsModule } from './modules/auths/auths.module';
import { UsersModule } from './modules/users/users.module';
import { MailsModule } from './modules/mails/mails.module';
import { DatabaseModule } from './configs/database/database.module';
import { BullMQConfigModule } from './configs/bullmq/bullmqConfig.module';
import { RedisConfigModule } from './configs/database/redisConfig.module';
import { FriendsModule } from './modules/friends/friends.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullMQConfigModule,
    RedisConfigModule,
    DatabaseModule,
    AuthsModule,
    UsersModule,
    MailsModule,
    FriendsModule,
    UploadsModule,
    PostsModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
