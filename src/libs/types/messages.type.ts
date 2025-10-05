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
