import { Controller, Get, Param } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':conversationId')
  fetchMessages(@Param('conversationId') conversationId: string) {
    return this.messagesService.fetchMessagesByConversationId(conversationId);
  }
}
