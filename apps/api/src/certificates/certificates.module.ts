import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports:     [UploadsModule],
  controllers: [CertificatesController],
  providers:   [CertificatesService],
  exports:     [CertificatesService],
})
export class CertificatesModule {}
