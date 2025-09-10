import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from '@social/users/schemas/user.schema';
import { Story } from './story.schema';

export type StoryLikeDocument = HydratedDocument<StoryLike>;

@Schema({ timestamps: true })
export class StoryLike {
  @Prop({ required: true, type: String, ref: Story.name })
  storyId: string;

  @Prop({ required: true, type: String, ref: User.name })
  authorId: string;

  @Prop({ required: true, type: Number, enum: [1, 2, 3, 4, 5, 6] })
  type: number;
}

export const StoryLikeSchema = SchemaFactory.createForClass(StoryLike);
StoryLikeSchema.index({ storyId: 1, userId: 1 });
StoryLikeSchema.index({ storyId: 1, createdAt: -1 });
