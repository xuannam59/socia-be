export enum ENotificationType {
  POST_TAG = 'post_tag',
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  POST_SHARE = 'post_share',
  COMMENT_MENTION = 'comment_mention',
  COMMENT_LIKE = 'comment_like',
  COMMENT_REPLY = 'comment_reply',
  STORY_REACTION = 'story_reaction',
  FRIEND_REQUEST = 'friend_request',
  FRIEND_REQUEST_ACCEPT = 'friend_request_accept',
}

export enum EEntityType {
  POST = 'post',
  STORY = 'story',
  MESSAGE = 'message',
  CONVERSATION = 'conversation',
  FRIEND = 'friend',
  SYSTEM = 'system',
  FRIEND_REQUEST = 'friend_request',
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
  subEntityId?: string;
  entityType: EEntityType;
  type: string;
  seen: boolean;
  isRead: boolean;
  createdAt: Date;
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

export interface INotificationPostComment {
  postId: string;
  content: string;
  postAuthorId: string;
  commentId: string;
  commentAuthorId?: string;
  mentionsList: string[];
}

export interface INotificationCommentMention {
  postId: string;
  commentId: string;
  userIds: string[];
  message: string;
}

export interface INotificationCommentReply {
  postId: string;
  commentAuthorId: string;
  commentId: string;
  message: string;
}

export interface INotificationStoryReaction {
  storyId: string;
  authorId: string;
}

export interface INotificationFriendRequest {
  friendId: string;
  message: string;
}

export interface INotificationFriendRequestAccept {
  friendId: string;
}

export interface INotificationFriendRequestCancel {
  friendId: string;
}

export interface INotificationFriendRequestReject {
  friendId: string;
}
