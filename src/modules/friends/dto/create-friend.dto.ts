import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateFriendDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsMongoId()
  @IsNotEmpty()
  friendId: string;
}
