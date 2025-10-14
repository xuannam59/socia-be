import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import type { IRequest } from '@social/types/cores.type';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  create(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationsService.create(createConversationDto);
  }

  @Post('seen')
  seen(@Body('conversationIds') conversationIds: string[], @Req() req: IRequest) {
    return this.conversationsService.updateSeen(conversationIds, req.user);
  }

  @Post('read-and-seen')
  readAndSeen(@Body('conversationId') conversationId: string, @Req() req: IRequest) {
    return this.conversationsService.updateReadAndSeen(conversationId, req.user);
  }

  @Get()
  findAll(@Query() query: any, @Req() req: IRequest) {
    return this.conversationsService.findAll(query, req.user);
  }

  @Get('un-seen')
  getUnSeenConversations(@Req() req: IRequest) {
    return this.conversationsService.getUnSeenConversations(req.user);
  }

  @Post('id-or-create')
  getIdOrCreate(@Body() userIds: string[]) {
    return this.conversationsService.getIdOrCreate(userIds);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateConversationDto: UpdateConversationDto) {
    return this.conversationsService.update(+id, updateConversationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conversationsService.remove(+id);
  }
}
