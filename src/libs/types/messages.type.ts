export interface IMessage {
  _id: string;
  conversationId: string;
  sender: string;
  type: string;
  content: string;
  revoked: boolean;
  edited: boolean;
  userLikes: {
    userId: string;
    type: number;
  }[];
  mentions: {
    userId: string;
    position: {
      start: number;
      end: number;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISendMessage {
  _id: string;
  parentId: {
    _id: string;
    content: string;
    type: string;
    sender: { _id: string; fullname: string; avatar: string };
  };
  sender: { _id: string; fullname: string; avatar: string };
  type: string;
  conversationId: string;
  content: string;
  mentions: {
    userId: string;
    position: {
      start: number;
      end: number;
    };
  }[];
  userLiked: {
    userId: string;
    type: number;
  }[];
  status: 'pending' | 'success' | 'failed';
}

export interface IMessageTyping {
  conversationId: string;
  sender: { _id: string; fullname: string; avatar: string };
  status: 'typing' | 'stop_typing';
}

export interface IMessageReaction {
  conversationId: string;
  messageId: string;
  userId: string;
  type: number;
  isLike: boolean;
}

export interface IMessageEdit {
  _id: string;
  sender: { _id: string; fullname: string; avatar: string };
  type: string;
  conversationId: string;
  content: string;
  mentions: {
    userId: string;
    position: {
      start: number;
      end: number;
    };
  }[];
  timeEdited: Date;
}

export interface IMessageRevoke {
  conversationId: string;
  messageId: string;
  content: string;
  userId: string;
}

export interface IMessageReadByUser {
  conversationId: string;
  userId: string;
  lastMessageId: string;
}
