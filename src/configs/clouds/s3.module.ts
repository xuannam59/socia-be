import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Service } from './s3.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    S3Service,
    {
      provide: S3Client,
      useFactory: (config: ConfigService) =>
        new S3Client({
          region: config.get<string>('AWS_REGION', ''),
          credentials: {
            accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID', ''),
            secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
          },
        }),
      inject: [ConfigService],
    },
  ],
  exports: [S3Service],
})
export class S3Module {}
