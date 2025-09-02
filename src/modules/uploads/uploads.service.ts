import { BadRequestException, Injectable } from '@nestjs/common';
import { S3Service } from '@social/configs/clouds/s3.service';
import { convertSlug, generateS3Key } from '@social/utils/common';
import { v4 as uuidv4 } from 'uuid';
import {
  AbortChunkedUploadDto,
  CompleteChunkedUploadDto,
  GetChunkUploadUrlDto,
  InitChunkedUploadDto,
} from './dto/upload.dto';
import { IUser } from '@social/types/users.type';
import pLimit from 'p-limit';

@Injectable()
export class UploadsService {
  constructor(private readonly s3Service: S3Service) {}
  // Khởi tạo chunked upload
  async initChunkedUpload(initChunkedUploadDto: InitChunkedUploadDto, user: IUser) {
    const { filename, contentType, fileSize } = initChunkedUploadDto;
    if (fileSize > 1024 * 1024 * 1024) throw new BadRequestException('File size must be less than 1GB');

    const key = generateS3Key(filename, contentType, user._id);

    const { uploadId } = await this.s3Service.initMultipartUpload(key, contentType);

    return {
      uploadId,
      key,
    };
  }

  // Lấy presigned URL cho chunk cụ thể
  async getChunkUploadUrl(getChunkUploadUrlDto: GetChunkUploadUrlDto) {
    const { key, uploadId, partNumber } = getChunkUploadUrlDto;
    return this.s3Service.getPresignedUrlForPart(key, uploadId, partNumber);
  }

  // (merge chunks)
  async completeChunkedUpload(completeChunkedUploadDto: CompleteChunkedUploadDto) {
    const { key, uploadId, parts } = completeChunkedUploadDto;
    try {
      const result = await this.s3Service.completeMultipartUpload(key, uploadId, parts);
      return {
        success: true,
        url: result.url,
        key: result.key,
      };
    } catch (error) {
      await this.s3Service.abortMultipartUpload(key, uploadId);
      throw new BadRequestException(`Failed to complete upload: ${error.message}`);
    }
  }

  // Hủy upload
  async abortChunkedUpload(abortChunkedUploadDto: AbortChunkedUploadDto) {
    const { key, uploadId } = abortChunkedUploadDto;
    await this.s3Service.abortMultipartUpload(key, uploadId);
    return 'Upload aborted';
  }

  async uploadFile(file: Express.Multer.File, user: IUser) {
    const key = generateS3Key(file.originalname, file.mimetype, user._id);
    const { key: s3Key, url } = await this.s3Service.uploadBuffer(key, file.buffer, file.mimetype);
    return {
      key: s3Key,
      url,
    };
  }

  async deleteFile(key: string) {
    if (!key) throw new BadRequestException('Key is required');
    return this.s3Service.deleteObject(key);
  }

  async deleteFiles(keys: string[]) {
    if (keys.length === 0) return;
    const limit = pLimit(10);
    const deleteTasks: any[] = [];
    for (const key of keys) {
      const deleteTask = limit(async () => {
        await this.s3Service.deleteObject(key);
      });
      deleteTasks.push(deleteTask);
    }
    await Promise.all(deleteTasks);
    return 'Deleted files successfully';
  }
}
