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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
