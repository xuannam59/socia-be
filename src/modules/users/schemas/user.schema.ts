import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  fullname: string;

  @Prop({ type: String })
  avatar: string;

  @Prop({ type: String })
  cover: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String, default: 'USER' })
  role: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: String })
  status: string;

  @Prop({ type: Boolean, default: false })
  isBlocked: boolean;

  @Prop({ type: Date, default: null })
  blockedDate: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
