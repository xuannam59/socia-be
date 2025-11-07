import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/modules/messages/schemas/message.schema';
import { MessageSocketGateway } from './message-socket.gateway';
import { MessageSocketService } from './message-socket.service';
import { Conversation, ConversationSchema } from 'src/modules/conversations/schemas/conversation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  providers: [MessageSocketGateway, MessageSocketService],
})
export class MessageSocketModule {}
