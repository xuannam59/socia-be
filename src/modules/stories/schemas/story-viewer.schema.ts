import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from '@social/users/schemas/user.schema';
import { Story } from './story.schema';

export type StoryViewerDocument = HydratedDocument<StoryViewer>;

@Schema({ timestamps: true })
export class StoryViewer {
  @Prop({ required: true, type: String, ref: Story.name })
  storyId: string;

  @Prop({ required: true, type: String, ref: User.name })
  authorId: string;

  @Prop({ type: Date, expires: 0, required: true })
  expiresAt: Date;
}

export const StoryViewerSchema = SchemaFactory.createForClass(StoryViewer);
StoryViewerSchema.index({ storyId: 1, authorId: 1 });
