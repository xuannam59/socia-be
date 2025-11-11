import { IsArray, IsIn, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['public', 'private', 'friends'])
  privacy: string;

  @IsArray()
  @IsOptional()
  medias: {
    type: 'image' | 'video';
    keyS3: string;
  }[];

  @IsArray()
  @IsOptional()
  userTags: string[];

  @IsString()
  @IsOptional()
  feeling: string;
}

export class CreateSharePostDto {
  @IsNotEmpty()
  @IsString()
  parentId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['public', 'private', 'friends'])
  privacy: string;
}
export class CreatePostLikeDto {
  @IsNotEmpty()
  @IsMongoId()
  postId: Types.ObjectId;

  @IsNotEmpty()
  @IsIn([1, 2, 3, 4, 5, 6])
  type: number;

  @IsNotEmpty()
  isLike: boolean;
}
