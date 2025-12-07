import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from '@social/users/schemas/user.schema';
import { Post } from './post.schema';

export type PostSaveDocument = HydratedDocument<PostSave>;

@Schema({ timestamps: true })
export class PostSave {
  @Prop({ required: true, type: String, ref: User.name })
  userId: string;

  @Prop({ required: true, type: String, ref: Post.name })
  postId: string;
}

export const PostSaveSchema = SchemaFactory.createForClass(PostSave);
