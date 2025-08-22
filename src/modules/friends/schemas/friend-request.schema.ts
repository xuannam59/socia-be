import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FriendRequestDocument = HydratedDocument<FriendRequest>;

@Schema({ timestamps: true })
export class FriendRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  fromUserId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  toUserId: string;

  @Prop({ required: true, default: 'pending', enum: ['pending', 'accepted', 'rejected'] })
  status: string;
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);

FriendRequestSchema.index(
  { fromUserId: 1, toUserId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);
