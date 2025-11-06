import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from '@social/users/schemas/user.schema';
import { HydratedDocument } from 'mongoose';
import { StoryViewer } from './story-viewer.schema';

export type StoryDocument = HydratedDocument<Story>;

@Schema({
  timestamps: true,
})
export class Story {
  @Prop({ required: true, type: String, ref: User.name })
  authorId: string;

  @Prop({ type: String })
  content: string;

  @Prop({ type: Object })
  media: {
    keyS3: string;
    type: string;
  };

  @Prop({ type: String, required: true, enum: ['image', 'video', 'text'] })
  type: string;

  @Prop({ type: String, required: true, enum: ['public', 'private', 'friends'] })
  privacy: string;

  @Prop({ type: String, required: true })
  backgroundColor: string;

  @Prop({ type: [String], default: [], ref: StoryViewer.name })
  viewers: string[];

  @Prop({ type: Number, default: 15 })
  duration: number;

  @Prop({ type: Date })
  expiresAt: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);

StorySchema.index({ authorId: 1, createdAt: -1, expiresAt: 1 });
