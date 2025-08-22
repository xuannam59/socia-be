import { Controller, Post, Body, Req } from '@nestjs/common';
import { FriendsService } from './friends.service';
import type { IRequest } from '@social/types/cores.type';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  createFriendRequest(@Body('toUserId') toUserId: string, @Req() req: IRequest) {
    return this.friendsService.createFriendRequest(toUserId, req.user);
  }

  @Post('accept')
  acceptFriendRequest(@Body('fromUserId') fromUserId: string, @Req() req: IRequest) {
    return this.friendsService.acceptFriendRequest(fromUserId, req.user);
  }
}
