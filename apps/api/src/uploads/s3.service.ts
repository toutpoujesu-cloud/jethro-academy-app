import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { PresignedUrlDto, ALLOWED_MIME } from './dto/presigned-url.dto';

const MAX_SIZES: Record<string, number> = {
  VIDEO:       2 * 1024 * 1024 * 1024,  // 2 GB
  AUDIO:       500 * 1024 * 1024,        // 500 MB
  PDF:         100 * 1024 * 1024,        // 100 MB
  IMAGE:       10  * 1024 * 1024,        // 10 MB
  CERTIFICATE: 10  * 1024 * 1024,        // 10 MB
};

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly presignedExpires: number;

  constructor(private readonly configService: ConfigService) {
    this.bucket = configService.getOrThrow<string>('s3.bucket');
    this.presignedExpires = configService.get<number>('s3.presignedUrlExpires', 3600);

    this.client = new S3Client({
      region: configService.getOrThrow<string>('s3.region'),
      credentials: {
        accessKeyId:     configService.getOrThrow<string>('s3.accessKeyId'),
        secretAccessKey: configService.getOrThrow<string>('s3.secretAccessKey'),
      },
    });
  }

  async generatePresignedUploadUrl(dto: PresignedUrlDto): Promise<{
    uploadUrl:  string;
    objectKey:  string;
    publicUrl:  string;
    expiresIn:  number;
  }> {
    // Validate MIME type
    const allowed = ALLOWED_MIME[dto.fileType];
    if (!allowed.includes(dto.mimeType)) {
      throw new BadRequestException(
        `MIME type "${dto.mimeType}" is not allowed for ${dto.fileType}. Allowed: ${allowed.join(', ')}`,
      );
    }

    // Validate file size
    const maxSize = MAX_SIZES[dto.fileType];
    if (dto.fileSizeBytes > maxSize) {
      const mb = Math.round(maxSize / 1024 / 1024);
      throw new BadRequestException(`File size exceeds the ${mb} MB limit for ${dto.fileType}`);
    }

    const ext = this.getExtension(dto.mimeType);
    const objectKey = `uploads/${dto.fileType.toLowerCase()}/${uuidv4()}${ext}`;

    const command = new PutObjectCommand({
      Bucket:        this.bucket,
      Key:           objectKey,
      ContentType:   dto.mimeType,
      ContentLength: dto.fileSizeBytes,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: this.presignedExpires });
    const publicUrl = `https://${this.bucket}.s3.amazonaws.com/${objectKey}`;

    this.logger.log(`Presigned URL generated for ${objectKey}`);
    return { uploadUrl, objectKey, publicUrl, expiresIn: this.presignedExpires };
  }

  async generatePresignedDownloadUrl(objectKey: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: objectKey });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
    this.logger.log(`Deleted S3 object: ${objectKey}`);
  }

  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'video/mp4':         '.mp4',
      'video/quicktime':   '.mov',
      'video/x-msvideo':   '.avi',
      'audio/mpeg':        '.mp3',
      'audio/mp4':         '.m4a',
      'audio/ogg':         '.ogg',
      'audio/wav':         '.wav',
      'application/pdf':   '.pdf',
      'image/jpeg':        '.jpg',
      'image/png':         '.png',
      'image/webp':        '.webp',
      'image/svg+xml':     '.svg',
    };
    return map[mimeType] ?? '';
  }
}
