import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { S3Service } from './s3.service';
import { VimeoService } from './vimeo.service';
import { PresignedUrlDto } from './dto/presigned-url.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateVimeoSlotDto {
  @ApiProperty({ example: 'Servant Leadership in Scripture' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ example: 104857600, description: 'File size in bytes' })
  @IsNumber() @Min(1)
  fileSizeBytes: number;
}

class DeleteS3ObjectDto {
  @ApiProperty({ example: 'uploads/pdf/abc-123.pdf' })
  @IsString() @IsNotEmpty()
  objectKey: string;
}

@ApiTags('uploads')
@ApiBearerAuth('access-token')
@Roles(UserRole.INSTRUCTOR, UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN)
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly s3Service:    S3Service,
    private readonly vimeoService: VimeoService,
  ) {}

  // POST /api/v1/uploads/s3-presigned
  @Post('s3-presigned')
  @ApiOperation({ summary: 'Get a presigned S3 URL for direct file upload (Instructor+)' })
  getPresignedUrl(@Body() dto: PresignedUrlDto) {
    return this.s3Service.generatePresignedUploadUrl(dto);
  }

  // POST /api/v1/uploads/vimeo
  @Post('vimeo')
  @ApiOperation({ summary: 'Create a Vimeo tus upload slot (Instructor+)' })
  createVimeoSlot(@Body() dto: CreateVimeoSlotDto) {
    return this.vimeoService.createUploadSlot(dto);
  }

  // POST /api/v1/uploads/vimeo/:videoId/publish — Admin+
  @Post('vimeo/:videoId/publish')
  @Roles(UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish Vimeo video after review (Admin+)' })
  publishVideo(@Param('videoId') videoId: string) {
    return this.vimeoService.publishVideo(videoId);
  }

  // POST /api/v1/uploads/vimeo/:videoId/status
  @Post('vimeo/:videoId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Vimeo video transcoding status' })
  getVideoStatus(@Param('videoId') videoId: string) {
    return this.vimeoService.getVideoStatus(videoId);
  }

  // DELETE /api/v1/uploads/s3
  @Delete('s3')
  @Roles(UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an S3 object (Admin+)' })
  deleteS3Object(@Body() dto: DeleteS3ObjectDto) {
    return this.s3Service.deleteObject(dto.objectKey);
  }
}
