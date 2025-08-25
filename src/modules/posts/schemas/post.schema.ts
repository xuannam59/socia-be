import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, enum: ['public', 'private', 'friends'] })
  privacy: string;

  @Prop({ type: [Object] })
  medias: {
    type: 'image' | 'video';
    keyS3: string;
  }[];

  @Prop({ type: [Types.ObjectId], ref: 'User' })
  userTags: Types.ObjectId[];

  @Prop()
  feelings: string;

  @Prop({ default: 0, type: Number })
  likeCount: number;

  @Prop({ default: 0, type: Number })
  commentCount: number;

  @Prop({ default: 0, type: Number })
  shareCount: number;

  @Prop({ default: 0, type: Number })
  viewCount: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ userId: 1, createdAt: -1 }); // Get posts by author
PostSchema.index({ createdAt: -1 }); // Get posts by createdAt
