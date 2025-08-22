import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendShip, FriendShipSchema } from './schemas/friend-ship.schema';
import { FriendRequest, FriendRequestSchema } from './schemas/friend-request.schema';
import { User, UserSchema } from '@social/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FriendShip.name, schema: FriendShipSchema },
      { name: FriendRequest.name, schema: FriendRequestSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
