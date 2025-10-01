import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import type { IRequest } from '@social/types/cores.type';
import type { IFriendListQuery } from '@social/types/users.type';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('friend-list')
  fetchUserFriendList(@Query() query: IFriendListQuery, @Req() req: IRequest) {
    return this.usersService.fetchUserFriendList(req.user, query);
  }

  @Get('conversation-friend-list')
  getConversationFriendList(@Req() req: IRequest) {
    return this.usersService.getConversationFriendList(req.user);
  }

  @Get(':id')
  findUserInfo(@Param('id') id: string) {
    return this.usersService.findUserInfo(id);
  }
}
