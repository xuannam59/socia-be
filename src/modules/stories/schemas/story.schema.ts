import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StoryDocument = HydratedDocument<Story>;

@Schema({
  timestamps: true,
})
export class Story {
  @Prop({ required: true })
  authorId: string;

  @Prop({ type: String })
  content: string;

  @Prop({ type: Object })
  media: {
    keyS3: string;
    type: string;
  };

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, required: true })
  privacy: string;

  @Prop({ type: String, required: true })
  backgroundColor: string;

  @Prop({ type: Number, default: 0 })
  viewCount: number;

  @Prop({ type: Number, default: 15 })
  duration: number;

  @Prop({ type: Date, default: Date.now })
  expiresAt: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);

StorySchema.index({ authorId: 1, expiresAt: 1, createdAt: -1 });
