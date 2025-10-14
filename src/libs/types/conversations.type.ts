export interface IConversation {
  _id: string;
  isGroup: boolean;
  name: string;
  avatar: string;
  participants: string[];
  participantStates: {
    user: string;
    readLastMessage: string;
  }[];
  admins: string[];
  lastMessage: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
