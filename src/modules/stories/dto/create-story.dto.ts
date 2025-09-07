import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

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
