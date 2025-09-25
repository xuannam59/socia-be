import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Boolean, default: false })
  isGroup: boolean;

  @Prop({ type: String, default: null })
  name: string;

  @Prop({ type: String, default: null })
  avatar: string;

  @Prop({ type: [String], ref: 'User', required: true })
  participants: string[];

  @Prop({ type: [Object], default: [] })
  participantStates: {
    user: string;
    lastReadAt: Date;
  }[];

  @Prop({ type: [String], ref: 'User', default: [] })
  admins: string[];

  @Prop({ type: String, default: null })
  lastMessage: string;

  @Prop({ type: Date, default: null, index: true })
  lastMessageAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ participants: 1, isGroup: 1 });
ConversationSchema.index({ lastMessageAt: -1 });
