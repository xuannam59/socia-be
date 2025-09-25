export interface INotification {
  _id: string;
  userId: string;
  actorId: string;
  type: 'post' | 'comment' | 'story' | 'message' | 'conversation' | 'friend' | 'system';
  resourceId?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  title?: string;
  content?: string;
  link?: string;
  readAt?: Date;
  priority: 'low' | 'normal' | 'high';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
