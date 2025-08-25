import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly bucket: string;

  constructor(
    private readonly s3: S3Client,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.get<string>('AWS_S3_BUCKET_KEY', '');
  }

  // Khởi tạo multipart upload
  async initMultipartUpload(key: string, contentType: string) {
    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });

    const response = await this.s3.send(command);
    return {
      uploadId: response.UploadId,
      key,
    };
  }

  // Tạo presigned URL cho từng chunk
  async getPresignedUrlForPart(
    key: string,
    uploadId: string,
    partNumber: number,
    expiresSec = 1800, // 30 phút
  ) {
    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: expiresSec });
    return { url, partNumber };
  }

  // Hoàn thành multipart upload (merge chunks)
  async completeMultipartUpload(key: string, uploadId: string, parts: Array<{ ETag: string; PartNumber: number }>) {
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
      },
    });

    const response = await this.s3.send(command);
    return {
      location: response.Location,
      key,
      url: this.getUrl(key),
    };
  }

  // Hủy multipart upload
  async abortMultipartUpload(key: string, uploadId: string) {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
    });

    await this.s3.send(command);
  }

  async uploadBuffer(key: string, body: Buffer, contentType: string): Promise<{ key: string; url: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await this.s3.send(command);

    const url = this.getUrl(key);
    return { key, url };
  }

  async deleteObject(key: string) {
    const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });
    await this.s3.send(command);
  }

  getUrl(key: string) {
    const bucket = this.config.get<string>('AWS_S3_BUCKET_KEY', '');
    const region = this.config.get<string>('AWS_REGION', '');
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}
