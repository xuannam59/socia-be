import { BadRequestException, Injectable } from '@nestjs/common';
import { convertSlug, getPublicIdFromUrl } from '@social/utils/common';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  async uploadFile(file: Express.Multer.File, folderName: string): Promise<any> {
    const originalName = file.originalname.split('.')[0];
    const uniqueFilename = `${convertSlug(originalName)}-${Date.now()}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderName,
          public_id: uniqueFilename,
        },
        (error, result) => {
          if (error) return reject(new BadRequestException(error.message));
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(url: string): Promise<any> {
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) throw new BadRequestException('Invalid URL');
    return cloudinary.uploader.destroy(publicId);
  }
}
