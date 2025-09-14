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

  @Prop({ type: String, default: null })
  googleId: string;

  @Prop({ type: String })
  cover: string;

  @Prop({ type: Date })
  dateOfBirth: Date; // Thêm ngày sinh

  @Prop({ type: String, enum: ['male', 'female', 'other'], default: 'other' })
  gender: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String, default: 'USER' })
  role: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: String, default: 'active', enum: ['active', 'inactive'] })
  status: string;

  @Prop({ type: [String], default: [] })
  followers: string[];

  @Prop({ type: [String], default: [] })
  following: string[];

  @Prop({ type: Date, default: null })
  endStoryAt: Date;

  @Prop({ type: Boolean, default: false })
  isOnline: boolean;

  @Prop({ type: Boolean, default: false })
  isBlocked: boolean;

  @Prop({ type: Date, default: null })
  blockedDate: Date;

  @Prop({ type: Date, default: null })
  lastActive: Date;

  @Prop({ type: String })
  slug: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
UserSchema.index({ slug: 1 });
UserSchema.index({ endStoryAt: -1 });
