import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  feelings: string;
}
