import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MentionDto {
  @IsNotEmpty()
  userId: string;

  @IsObject()
  @IsNotEmpty()
  position: {
    start: number;
    end: number;
  };
}

export class CreateCommentDto {
  @IsString()
  @IsOptional()
  content: string;

  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsString()
  @IsOptional()
  parentId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(2)
  level: number;

  @IsObject()
  @IsOptional()
  media: {
    type: 'image';
    keyS3: string;
  };

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MentionDto)
  mentions: MentionDto[];
}

export class CreateCommentLikeDto {
  @IsNotEmpty()
  @IsString()
  commentId: string;

  @IsNotEmpty()
  @IsIn([1, 2, 3, 4, 5, 6])
  type: number;

  @IsNotEmpty()
  isLike: boolean;
}
