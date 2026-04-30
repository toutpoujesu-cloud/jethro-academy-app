import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum UploadFileType {
  VIDEO       = 'VIDEO',
  AUDIO       = 'AUDIO',
  PDF         = 'PDF',
  IMAGE       = 'IMAGE',   // Thumbnails, avatars
  CERTIFICATE = 'CERTIFICATE',
}

const ALLOWED_MIME: Record<UploadFileType, string[]> = {
  [UploadFileType.VIDEO]:       ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  [UploadFileType.AUDIO]:       ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav'],
  [UploadFileType.PDF]:         ['application/pdf'],
  [UploadFileType.IMAGE]:       ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  [UploadFileType.CERTIFICATE]: ['application/pdf'],
};

export { ALLOWED_MIME };

export class PresignedUrlDto {
  @ApiProperty({ enum: UploadFileType, example: UploadFileType.PDF })
  @IsEnum(UploadFileType)
  fileType: UploadFileType;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  mimeType: string;

  @ApiProperty({ example: 5242880, description: 'File size in bytes' })
  @IsNumber()
  @Min(1)
  @Max(5 * 1024 * 1024 * 1024) // 5 GB max
  fileSizeBytes: number;

  @ApiPropertyOptional({ example: 'lesson-reading.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;
}
