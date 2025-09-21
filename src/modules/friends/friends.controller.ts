import { Controller, Post, Body, Req, Get, Param } from '@nestjs/common';
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
  AcceptRequest(@Body('fromUserId') fromUserId: string, @Req() req: IRequest) {
    return this.friendsService.AcceptRequest(fromUserId, req.user);
  }

  @Post('reject')
  rejectFriendRequest(@Body('userId') userId: string, @Req() req: IRequest) {
    return this.friendsService.rejectRequest(userId, req.user);
  }

  @Post('unfriend')
  unfriend(@Body('userId') userId: string, @Req() req: IRequest) {
    return this.friendsService.unfriend(userId, req.user);
  }

  @Get(':userId')
  getFriends(@Param('userId') userId: string, @Req() req: IRequest) {
    return this.friendsService.getFriends(userId, req.user);
  }
}
