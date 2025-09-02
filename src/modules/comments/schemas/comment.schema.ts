import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Post' })
  postId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  authorId: Types.ObjectId;

  @Prop({ type: String })
  content: string;

  @Prop({ type: [Object] })
  medias: {
    type: 'image';
    keyS3: string;
  }[];

  @Prop({
    type: [
      {
        userId: { type: String, ref: 'User' },
        position: {
          start: { type: Number },
          end: { type: Number },
        },
      },
    ],
  })
  mentions: {
    userId: string;
    position: {
      start: number;
      end: number;
    };
  }[];

  @Prop({ type: Types.ObjectId, ref: 'PostComment', default: null })
  parentId: Types.ObjectId | null;

  @Prop({ type: Number, min: 0, max: 2 })
  level: number;

  @Prop({ type: Number, default: 0 })
  likeCount: number;

  @Prop({ type: Number, default: 0 })
  replyCount: number;

  @Prop({ type: Boolean, default: false })
  isEdited: boolean;

  @Prop({ type: Date })
  editedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.index({ postId: 1, level: 1, createdAt: -1 }); // Get comments of post
CommentSchema.index({ parentId: 1, level: 1, createdAt: -1 }); // Get comments of parent
CommentSchema.index({ authorId: 1, createdAt: -1 }); // Get comments by author
