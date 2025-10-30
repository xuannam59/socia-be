import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '@social/users/schemas/user.schema';
import { Post } from 'src/modules/posts/schemas/post.schema';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true, type: Types.ObjectId, ref: Post.name })
  postId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  authorId: Types.ObjectId;

  @Prop({ type: String })
  content: string;

  @Prop({ type: Object })
  media: {
    type: 'image';
    keyS3: string;
  };

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

  @Prop({ type: [Object], default: [] })
  userLikes: {
    userId: string;
    type: number;
  }[];

  @Prop({ type: Types.ObjectId, ref: Comment.name, default: null })
  parentId: Types.ObjectId | null;

  @Prop({ type: Number, min: 0, max: 2 })
  level: number;

  @Prop({ type: Number, default: 0 })
  replyCount: number;

  @Prop({ type: Boolean, default: false })
  isEdited: boolean;

  @Prop({ type: Date })
  editedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Optimized indexes for better query performance
CommentSchema.index({ postId: 1, level: 1, createdAt: -1 }); // Get comments of post (compound index)
CommentSchema.index({ parentId: 1, level: 1, createdAt: -1 }); // Get replies of a comment
CommentSchema.index({ authorId: 1, createdAt: -1 }); // Get user's comments
CommentSchema.index({ postId: 1, createdAt: -1 }); // General post comments query
CommentSchema.index({ level: 1, createdAt: -1 }); // Level-based queries
