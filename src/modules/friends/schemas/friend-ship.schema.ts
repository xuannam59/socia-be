import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FriendShipDocument = HydratedDocument<FriendShip>;

@Schema({ timestamps: true })
export class FriendShip {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userIdA: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userIdB: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  users: string[];

  @Prop({ required: true, default: 'pending', enum: ['pending', 'accepted', 'rejected'] })
  status: string;
}

export const FriendShipSchema = SchemaFactory.createForClass(FriendShip);

FriendShipSchema.index({ userIdA: 1, userIdB: 1 }, { unique: true });
