import { PartialType } from '@nestjs/mapped-types';
import { CreateConversationDto } from './create-conversation.dto';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UpdateConversationDto extends PartialType(CreateConversationDto) {}

export class AddMembersToConversationDto {
  @IsArray()
  @IsNotEmpty()
  userIds: string[];

  @IsString()
  @IsNotEmpty()
  conversationId: string;
}

export class RemoveMemberFromConversationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  conversationId: string;
}

export class GrantAdminDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  conversationId: string;
}

export class RevokeAdminDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  conversationId: string;
}
