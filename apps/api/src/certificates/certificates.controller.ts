import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IJwtPayload } from '@jethro/shared';
import { CertificatesService } from './certificates.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  // GET /api/v1/certificates — own certs
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Get learner's own earned certificates" })
  findOwn(@CurrentUser() user: IJwtPayload) {
    return this.certificatesService.findOwn(user);
  }

  // GET /api/v1/certificates/all — Admin+
  @Get('all')
  @Roles(UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all certificates (Admin+)' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.certificatesService.findAll(page, limit);
  }

  // GET /api/v1/certificates/verify/:code — Public
  @Public()
  @Get('verify/:code')
  @ApiOperation({ summary: 'Verify a certificate by its unique verification code (public)' })
  verify(@Param('code') code: string) {
    return this.certificatesService.verify(code);
  }

  // GET /api/v1/certificates/:id/download — own cert only
  @Get(':id/download')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a time-limited download URL for a certificate PDF' })
  download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.certificatesService.getDownloadUrl(id, user);
  }
}
