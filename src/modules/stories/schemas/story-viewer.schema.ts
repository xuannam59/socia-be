import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from '@social/users/schemas/user.schema';

export type StoryViewerDocument = HydratedDocument<StoryViewer>;

@Schema({ timestamps: true })
export class StoryViewer {
  @Prop({ required: true, type: String, ref: 'Story' })
  storyId: string;

  @Prop({ required: true, type: String, ref: User.name })
  userId: string;

  @Prop({ type: Number })
  likedType: number;

  @Prop({ type: Date, expires: 0 })
  expiresAt: Date;
}

export const StoryViewerSchema = SchemaFactory.createForClass(StoryViewer);
StoryViewerSchema.index({ storyId: 1, authorId: 1 });
