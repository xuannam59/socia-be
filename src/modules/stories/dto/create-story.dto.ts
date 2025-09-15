import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateStoryDto {
  @IsOptional()
  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  media: {
    keyS3: string;
    type: string;
  };

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  privacy: string;

  @IsNotEmpty()
  @IsString()
  backgroundColor: string;
}

export class CreateStoryLikeDto {
  @IsNotEmpty()
  @IsIn([1, 2, 3, 4, 5, 6])
  type: number;
}
