import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from '@social/users/schemas/user.schema';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: String, ref: 'Message', default: null })
  parentId: string;

  @Prop({ type: String, ref: 'Conversation', required: true, index: true })
  conversationId: string;

  @Prop({ type: String, ref: 'User', required: true, index: true })
  sender: string;

  @Prop({ type: String, enum: ['text', 'image', 'video'], default: 'text' })
  type: string;

  @Prop({ type: String, default: '' })
  content: string;

  @Prop({ type: Boolean, default: false })
  revoked: boolean;

  @Prop({ type: String })
  revokedContent: string;

  @Prop({ type: Boolean, default: false })
  edited: boolean;

  @Prop({ type: Date, default: null })
  timeEdited: Date;

  @Prop({ type: [Object], default: [] })
  userLikes: {
    userId: string;
    type: number;
  }[];

  @Prop({
    type: [
      {
        userId: { type: String, ref: User.name },
        position: {
          start: { type: Number },
          end: { type: Number },
        },
      },
    ],
    _id: false,
  })
  mentions: {
    userId: string;
    position: {
      start: number;
      end: number;
    };
  }[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, _id: -1 });
