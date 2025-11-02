import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { S3Module } from '@social/configs/clouds/s3.module';
import { CloudinaryModule } from '@social/configs/clouds/cloudinary.module';

@Module({
  imports: [S3Module, CloudinaryModule],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
