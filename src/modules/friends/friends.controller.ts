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

  @Get()
  getFriendList(@Req() req: IRequest) {
    return this.friendsService.getFriendList(req.user);
  }

  @Get(':userId')
  getFriendStatus(@Param('userId') userId: string, @Req() req: IRequest) {
    return this.friendsService.getFriendStatus(userId, req.user);
  }
}
