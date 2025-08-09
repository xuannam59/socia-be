import { Request } from 'express';
import { IUser } from './users.type';

export interface IRequest extends Request {
  user: IUser;
}
