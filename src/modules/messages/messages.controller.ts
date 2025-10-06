import { Controller, Get, Param, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':conversationId')
  fetchMessages(@Param('conversationId') conversationId: string, @Query() query: any) {
    return this.messagesService.fetchMessagesByConversationId(conversationId, query);
  }
}
