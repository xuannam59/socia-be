import { IsOptional, IsString } from 'class-validator';

export class QueryFindAllConversationsDto {
  @IsString()
  @IsOptional()
  page: string;

  @IsString()
  @IsOptional()
  limit: string;
}
