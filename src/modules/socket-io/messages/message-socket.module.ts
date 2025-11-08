import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/modules/messages/schemas/message.schema';
import { MessageSocketGateway } from './message-socket.gateway';
import { MessageSocketService } from './message-socket.service';
import { Conversation, ConversationSchema } from 'src/modules/conversations/schemas/conversation.schema';
import { Story, StorySchema } from 'src/modules/stories/schemas/story.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Story.name, schema: StorySchema },
    ]),
  ],
  providers: [MessageSocketGateway, MessageSocketService],
})
export class MessageSocketModule {}
