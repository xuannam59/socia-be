import { Body, Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import type { IRequest } from '@social/types/cores.type';
import type { IFriendListQuery } from '@social/types/users.type';
import { UpdateUserProfileDto } from './dto/update-user.dto';

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

  @Get('friends/:userId')
  fetchUserFriendListByUserId(@Param('userId') userId: string, @Query() query: any) {
    return this.usersService.fetchUserFriendListByUserId(userId, query);
  }

  @Get(':id')
  findUserInfo(@Param('id') id: string) {
    return this.usersService.findUserInfo(id);
  }

  @Patch('avatar')
  updateAvatar(@Body('avatar') avatar: string, @Req() req: IRequest) {
    return this.usersService.updateAvatar(avatar, req.user);
  }

  @Patch('cover')
  updateUserCover(@Body('cover') cover: string, @Req() req: IRequest) {
    return this.usersService.updateUserCover(cover, req.user);
  }

  @Patch('profile')
  updateUserProfile(@Body() updateUserDto: UpdateUserProfileDto, @Req() req: IRequest) {
    return this.usersService.updateUserProfile(req.user, updateUserDto);
  }
}
