import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ForgotPasswordDocument = HydratedDocument<ForgotPassword>;

@Schema({ timestamps: true })
export class ForgotPassword {
  @Prop()
  email: string;

  @Prop()
  otp: string;

  @Prop({
    type: Date,
    default: Date.now,
    expires: 180,
  })
  expireAt: Date;
}

export const ForgotPasswordSchema = SchemaFactory.createForClass(ForgotPassword);
