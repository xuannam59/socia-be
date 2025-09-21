import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FriendShipDocument = HydratedDocument<FriendShip>;

@Schema({ timestamps: true })
export class FriendShip {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  fromUserId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  toUserId: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  users: string[];

  @Prop({ required: true, default: 'pending', enum: ['pending', 'accepted'] })
  status: string;
}

export const FriendShipSchema = SchemaFactory.createForClass(FriendShip);

// Optimized indexes for better query performance
FriendShipSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true }); // Unique friendship pair
FriendShipSchema.index({ users: 1 }); // General users lookup
FriendShipSchema.index({ status: 1, createdAt: -1 }); // Status-based queries
FriendShipSchema.index({ fromUserId: 1, status: 1 }); // Sent requests by user
FriendShipSchema.index({ toUserId: 1, status: 1 }); // Received requests by user
