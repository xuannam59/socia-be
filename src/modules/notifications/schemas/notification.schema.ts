import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  // Recipient of the notification
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  // The actor who triggered the notification (may be null for system notifications)
  @Prop({ type: Types.ObjectId, ref: 'User' })
  actorId?: Types.ObjectId;

  // What entity this notification is about
  @Prop({
    type: String,
    enum: ['post', 'comment', 'story', 'message', 'conversation', 'friend', 'system'],
    required: true,
  })
  type: string;

  // Reference to the target entity (generic id, varies by type)
  @Prop({ type: Types.ObjectId })
  resourceId?: Types.ObjectId;

  // Optional display information
  @Prop({ type: String })
  title?: string;

  @Prop({ type: String })
  content?: string;

  // Optional link to navigate the client to a screen
  @Prop({ type: String })
  link?: string;

  // Read/seen state
  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Date })
  readAt?: Date;

  // Priority for client-side ordering or badges
  @Prop({ type: String, enum: ['low', 'normal', 'high'], default: 'normal' })
  priority: string;

  // Arbitrary metadata for flexible use-cases
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  // Optional expiration time; if set, a TTL index will remove the document at this time
  @Prop({ type: Date })
  expiresAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// TTL index that only applies when expiresAt is set (MongoDB ignores docs where field is missing)
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
