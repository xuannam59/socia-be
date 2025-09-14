import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '@social/users/schemas/user.schema';
import { Comment } from './comment.schema';

export type CommentLikeDocument = HydratedDocument<CommentLike>;

@Schema({ timestamps: true })
export class CommentLike {
  @Prop({ required: true, type: Types.ObjectId, ref: Comment.name })
  commentId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  authorId: Types.ObjectId;

  @Prop({ default: false, type: Number, enum: [1, 2, 3, 4, 5, 6] })
  type: number;
}

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLike);

// Optimized indexes for aggregation queries
CommentLikeSchema.index({ commentId: 1, authorId: 1 }, { unique: true }); // Unique constraint + check if user has liked comment
CommentLikeSchema.index({ commentId: 1 }); // Get all likes for a comment
CommentLikeSchema.index({ authorId: 1, createdAt: -1 }); // Get user's like history
