import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CertificateStatus, LessonProgressStatus } from '@prisma/client';
import { IJwtPayload } from '@jethro/shared';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../uploads/s3.service';
import { generateVerificationCode } from '../common/utils/slug.util';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    private readonly prisma:     PrismaService,
    private readonly s3Service:  S3Service,
  ) {}

  // ── Trigger: check and issue certificate when course is completed ─────────
  async checkAndIssue(userId: string, courseId: string): Promise<void> {
    // Verify enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) return;

    // Check if certificate already issued
    const existing = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return;

    // Get all lessons in the course
    const course = await this.prisma.course.findUnique({
      where:   { id: courseId },
      include: { modules: { include: { lessons: { select: { id: true } } } } },
    });
    if (!course) return;

    const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    if (lessonIds.length === 0) return;

    // Count completed lessons
    const completedCount = await this.prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: lessonIds },
        status:   LessonProgressStatus.COMPLETED,
      },
    });

    if (completedCount < lessonIds.length) return; // Not done yet

    // Issue certificate
    const verificationCode = generateVerificationCode();
    const cert = await this.prisma.certificate.create({
      data: {
        userId,
        courseId,
        verificationCode,
        status: CertificateStatus.PENDING,
      },
    });

    this.logger.log(`Certificate issued: ${cert.id} for user=${userId} course=${courseId}`);

    // TODO: trigger PDF generation job (async)
    // For now, mark as ISSUED immediately (PDF generation can be added later)
    await this.prisma.certificate.update({
      where: { id: cert.id },
      data:  { status: CertificateStatus.ISSUED, issuedAt: new Date() },
    });
  }

  // ── List learner's own certificates ──────────────────────────────────────
  async findOwn(user: IJwtPayload) {
    return this.prisma.certificate.findMany({
      where:   { userId: user.sub, status: CertificateStatus.ISSUED },
      include: { course: { select: { id: true, title: true, thumbnailUrl: true } } },
      orderBy: { issuedAt: 'desc' },
    });
  }

  // ── Download signed URL ───────────────────────────────────────────────────
  async getDownloadUrl(id: string, user: IJwtPayload): Promise<{ url: string }> {
    const cert = await this.prisma.certificate.findUnique({ where: { id } });
    if (!cert || cert.userId !== user.sub) throw new NotFoundException('Certificate not found');
    if (!cert.pdfUrl) throw new NotFoundException('Certificate PDF is not yet generated');

    // Extract S3 key from URL
    const objectKey = cert.pdfUrl.replace(/^https:\/\/[^/]+\//, '');
    const url = await this.s3Service.generatePresignedDownloadUrl(objectKey, 300); // 5-min link
    return { url };
  }

  // ── Public: verify certificate by code ───────────────────────────────────
  async verify(code: string) {
    const cert = await this.prisma.certificate.findUnique({
      where:   { verificationCode: code },
      include: {
        user:   { select: { firstName: true, lastName: true } },
        course: { select: { title: true } },
      },
    });

    if (!cert || cert.status !== CertificateStatus.ISSUED) {
      return { valid: false, message: 'Certificate not found or has been revoked' };
    }

    return {
      valid: true,
      certificate: {
        verificationCode: cert.verificationCode,
        recipientName:    `${cert.user.firstName} ${cert.user.lastName}`,
        courseName:       cert.course.title,
        issuedAt:         cert.issuedAt,
        status:           cert.status,
      },
    };
  }

  // ── Admin: list all certificates ──────────────────────────────────────────
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      this.prisma.certificate.findMany({
        include: {
          user:   { select: { id: true, firstName: true, lastName: true, email: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.certificate.count(),
    ]);

    return { data: records, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
