import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { S3Service } from './s3.service';
import { VimeoService } from './vimeo.service';

@Module({
  controllers: [UploadsController],
  providers:   [S3Service, VimeoService],
  exports:     [S3Service, VimeoService],
})
export class UploadsModule {}
