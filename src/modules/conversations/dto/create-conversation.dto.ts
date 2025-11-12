import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  userIds: string[];

  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  avatar: string;
}

export class IdOrCreateConversationDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  userIds: string[];

  @IsBoolean()
  @IsOptional()
  isGroup: boolean;
}
