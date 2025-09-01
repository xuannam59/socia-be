import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentLikeDocument = HydratedDocument<CommentLike>;

@Schema({ timestamps: true })
export class CommentLike {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Comment' })
  commentId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  authorId: Types.ObjectId;

  @Prop({ default: false, type: Number, enum: [1, 2, 3, 4, 5, 6] })
  type: number;
}

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLike);
CommentLikeSchema.index({ commentId: 1, authorId: 1 }); // Check if user has liked comment
CommentLikeSchema.index({ commentId: 1 }); // Get likes of user
