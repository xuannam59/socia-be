import { IsArray, IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

class MentionDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: Types.ObjectId;

  @IsObject()
  @IsNotEmpty()
  position: {
    start: number;
    end: number;
  };
}

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsString()
  @IsOptional()
  parentId: string;

  @IsArray()
  @IsOptional()
  media: {
    type: 'image';
    keyS3: string;
  }[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MentionDto)
  mention: MentionDto[];
}
