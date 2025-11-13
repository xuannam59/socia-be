import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { IRequest } from '@social/types/cores.type';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto, IdOrCreateConversationDto } from './dto/create-conversation.dto';
import {
  AddMembersToConversationDto,
  EditConversationDto,
  GrantAdminDto,
  RemoveMemberFromConversationDto,
  RevokeAdminDto,
} from './dto/update-conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  createGroupConversation(@Body() createConversationDto: CreateConversationDto, @Req() req: IRequest) {
    return this.conversationsService.createGroupConversation(createConversationDto, req.user);
  }

  @Post('id-or-create')
  getIdOrCreate(@Body() payload: IdOrCreateConversationDto) {
    return this.conversationsService.getIdOrCreate(payload);
  }

  @Post('seen')
  seen(@Body('conversationIds') conversationIds: string[], @Req() req: IRequest) {
    return this.conversationsService.updateSeen(conversationIds, req.user);
  }

  @Patch('read')
  readAndSeen(@Body('conversationId') conversationId: string, @Req() req: IRequest) {
    return this.conversationsService.readConversation(conversationId, req.user);
  }

  @Get()
  findAll(@Query() query: any, @Req() req: IRequest) {
    return this.conversationsService.findAll(query, req.user);
  }

  @Get('un-seen')
  getUnSeenConversations(@Req() req: IRequest) {
    return this.conversationsService.getUnSeenConversations(req.user);
  }

  @Get('group')
  getGroupConversations(@Req() req: IRequest) {
    return this.conversationsService.getGroupConversations(req.user);
  }

  @Patch('add-members')
  addMembersToConversation(@Body() payload: AddMembersToConversationDto, @Req() req: IRequest) {
    return this.conversationsService.addMembersToConversation(payload, req.user);
  }

  @Patch('remove-member')
  removeMembersFromConversation(@Body() payload: RemoveMemberFromConversationDto, @Req() req: IRequest) {
    return this.conversationsService.removeMemberFromConversation(payload, req.user);
  }

  @Patch('grant-admin')
  grantAdmin(@Body() payload: GrantAdminDto, @Req() req: IRequest) {
    return this.conversationsService.grantAdmin(payload, req.user);
  }

  @Patch('revoke-admin')
  revokeAdmin(@Body() payload: RevokeAdminDto, @Req() req: IRequest) {
    return this.conversationsService.revokeAdmin(payload, req.user);
  }

  @Patch('edit')
  editConversation(@Body() payload: EditConversationDto, @Req() req: IRequest) {
    return this.conversationsService.editConversation(payload, req.user);
  }

  @Patch('leave')
  leaveConversation(@Body('conversationId') conversationId: string, @Req() req: IRequest) {
    return this.conversationsService.leaveConversation(conversationId, req.user);
  }

  @Delete(':conversationId')
  deleteConversation(@Param('conversationId') conversationId: string, @Req() req: IRequest) {
    return this.conversationsService.deleteConversation(conversationId, req.user);
  }
}
