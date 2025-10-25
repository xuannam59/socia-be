export enum ENotificationType {
  POST_TAG = 'post_tag',
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  POST_SHARE = 'post_share',
  COMMENT_MENTION = 'comment_mention',
  COMMENT_LIKE = 'comment_like',
  COMMENT_REPLY = 'comment_reply',
}

export enum EEntityType {
  POST = 'post',
  COMMENT = 'comment',
  STORY = 'story',
  MESSAGE = 'message',
  CONVERSATION = 'conversation',
  FRIEND = 'friend',
  SYSTEM = 'system',
}

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

export interface INotificationResponse {
  _id: string;
  senderIds: {
    _id: string;
    fullname: string;
    avatar: string;
  }[];
  message: string;
  entityId: string;
  entityType: EEntityType;
  type: string;
  seen: boolean;
  isRead: boolean;
}

export interface INotificationUserTag {
  postId: string;
  userTags: {
    _id: string;
    fullname: string;
    avatar: string;
  }[];
  message: string;
}

export interface INotificationPostLike {
  postId: string;
  creatorId: string;
  message: string;
}
