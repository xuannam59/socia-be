export interface IUser {
  _id: string;
  email: string;
  fullname: string;
  avatar: string;
  cover: string;
  phone: string;
  role: string;
  address: string;
  status: string;
  followers: string[];
  following: string[];
  friends: string[];
  endStoryAt: Date;
  isOnline: boolean;
  isBlocked: boolean;
  blockedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPayload {
  _id: string;
  email: string;
  fullname: string;
  role: string;
}

export interface IUserResponse {
  _id: string;
  email: string;
  fullname: string;
  role: string;
  avatar: string;
  cover?: string;
  followers: string[];
  following: string[];
  friends: string[];
  endStoryAt?: Date;
  isOnline: boolean;
  isBlocked: boolean;
  blockedDate: Date;
  phone: string;
  address: string;
  status: string;
  access_token?: string;
}
