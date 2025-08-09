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
