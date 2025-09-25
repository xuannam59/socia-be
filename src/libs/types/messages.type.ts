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
