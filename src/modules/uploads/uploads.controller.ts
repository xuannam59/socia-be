import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  AbortChunkedUploadDto,
  CompleteChunkedUploadDto,
  GetChunkUploadUrlDto,
  InitChunkedUploadDto,
} from './dto/upload.dto';
import { UploadsService } from './uploads.service';
import type { IRequest } from '@social/types/cores.type';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  // Khởi tạo chunked upload
  @Post('initiate-chunked')
  async initChunkedUpload(@Body() body: InitChunkedUploadDto, @Req() req: IRequest) {
    return this.uploadsService.initChunkedUpload(body, req.user);
  }

  // Lấy presigned URL cho chunk
  @Post('chunk-url')
  async getChunkUploadUrl(@Body() body: GetChunkUploadUrlDto) {
    return this.uploadsService.getChunkUploadUrl(body);
  }

  // Hoàn thành chunked upload
  @Post('complete-chunked')
  async completeChunkedUpload(@Body() body: CompleteChunkedUploadDto) {
    return this.uploadsService.completeChunkedUpload(body);
  }

  // Hủy chunked upload
  @Post('abort-chunked')
  async abortChunkedUpload(@Body() body: AbortChunkedUploadDto) {
    return this.uploadsService.abortChunkedUpload(body);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType:
            /^image\/(jpeg|png|gif|webp)$|^video\/(mp4|webm|ogg)$|^audio\/(mpeg|mp3|wav|ogg)$|^application\/(pdf|msword)$|^text\/plain$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 5, //5MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Req() req: IRequest,
  ) {
    return this.uploadsService.uploadFile(file, req.user);
  }

  @Delete()
  async deleteFile(@Query('key') key: string) {
    return this.uploadsService.deleteFile(key);
  }
}
