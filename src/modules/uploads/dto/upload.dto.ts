import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

export class ChunkInfo {
  @IsNotEmpty()
  @IsString()
  ETag: string;

  @IsNotEmpty()
  @IsNumber()
  PartNumber: number;
}

export class InitChunkedUploadDto {
  @IsNotEmpty()
  @IsString()
  filename: string;

  @IsNotEmpty()
  @IsString()
  contentType: string;

  @IsNotEmpty()
  @IsNumber()
  fileSize: number;
}

export class GetChunkUploadUrlDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  uploadId: string;

  @IsNotEmpty()
  @IsNumber()
  partNumber: number;
}

export class CompleteChunkedUploadDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  uploadId: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChunkInfo)
  parts: ChunkInfo[];
}

export class AbortChunkedUploadDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  uploadId: string;
}
