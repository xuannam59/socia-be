import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from '@social/configs/clouds/cloudinary.service';
import { S3Service } from '@social/configs/clouds/s3.service';
import { IUser } from '@social/types/users.type';
import { generateS3Key } from '@social/utils/common';
import pLimit from 'p-limit';
import tinify from 'tinify';
import {
  AbortChunkedUploadDto,
  CompleteChunkedUploadDto,
  GetChunkUploadUrlDto,
  InitChunkedUploadDto,
} from './dto/upload.dto';

@Injectable()
export class UploadsService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) {
    tinify.key = this.configService.get<string>('TINIFY_API_KEY', '');
  }

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

  // Cloudinary Upload
  async uploadFileToCloudinary(file: Express.Multer.File, folderName: string) {
    try {
      let optimizedBuffer = file.buffer;

      if (file.size > 100 * 1024) {
        const isImage = file.mimetype?.startsWith('image/');

        if (isImage) {
          try {
            const source = tinify.fromBuffer(file.buffer);
            const optimizedUint8Array = await source.toBuffer();
            optimizedBuffer = Buffer.from(optimizedUint8Array);
          } catch (error) {
            console.log('Tinify optimization error:', error);
            optimizedBuffer = file.buffer;
          }
        }
      }
      const optimizedFile: Express.Multer.File = {
        ...file,
        buffer: optimizedBuffer,
        size: optimizedBuffer.length,
      };

      const link = await this.cloudinaryService.uploadFile(optimizedFile, folderName);
      return {
        fileUpload: link.secure_url,
        publicId: link.public_id,
      };
    } catch (error) {
      console.log('uploadFileToCloudinary Error:', error);
      throw new BadRequestException('Error unable to upload file');
    }
  }

  async deleteFileFromCloudinary(fileUrl: string) {
    try {
      if (!fileUrl) return;
      const result = await this.cloudinaryService.deleteFile(fileUrl);
      return {
        result,
      };
    } catch (error) {
      console.log('deleteFileFromCloudinary Error:', error);
      throw new BadRequestException('Error unable to delete file');
    }
  }
}
