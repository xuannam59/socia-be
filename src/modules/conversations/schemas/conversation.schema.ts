import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from '@social/users/schemas/user.schema';
import { Message } from 'src/modules/messages/schemas/message.schema';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Boolean, default: false })
  isGroup: boolean;

  @Prop({ type: String, default: null })
  name: string;

  @Prop({ type: String, default: null })
  avatar: string;

  @Prop({
    type: [Object],
    required: true,
  })
  usersState: {
    user: string;
    readLastMessage: string;
  }[];

  @Prop({ type: [String], default: [], ref: User.name })
  users: string[];

  @Prop({ type: [String], default: [] })
  seen: string[];

  @Prop({ type: [String], ref: User.name, default: [] })
  admins: string[];

  @Prop({ type: String, default: null, ref: Message.name })
  lastMessage: string;

  @Prop({ type: Date, default: null, index: true })
  lastMessageAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ users: 1, isGroup: 1 });
ConversationSchema.index({ users: 1, lastMessageAt: -1 });
