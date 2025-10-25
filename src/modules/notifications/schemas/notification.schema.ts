import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from '@social/users/schemas/user.schema';
import { EEntityType, ENotificationType } from '@social/types/notifications.type';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, type: [String], ref: User.name })
  senderIds: string[];

  @Prop({ type: String, required: true })
  receiverId: string;

  @Prop({
    type: String,
    enum: ENotificationType,
    required: true,
  })
  type: ENotificationType;

  @Prop({
    type: String,
    enum: EEntityType,
    required: true,
  })
  entityType: EEntityType;

  @Prop({ type: String })
  entityId: string;

  @Prop({ type: String })
  message: string;

  @Prop({ type: Boolean, default: false })
  seen: boolean;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Date })
  expiresAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
NotificationSchema.index({ receiverId: 1, type: 1, entityId: 1, createdAt: -1 });
NotificationSchema.index({ receiverId: 1, isRead: 1, type: 1, entityId: 1, createdAt: -1 });
