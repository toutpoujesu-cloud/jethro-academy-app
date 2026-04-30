import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { IJwtPayload } from '@jethro/shared';
import { PrismaService } from '../prisma/prisma.service';
import { parsePagination, buildMeta } from '../common/utils/pagination.util';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Create a notification (internal — called by other services) ───────────
  async create(params: {
    userId:  string;
    type:    NotificationType;
    title:   string;
    message: string;
    data?:   Record<string, unknown>;
  }) {
    const notification = await this.prisma.notification.create({ data: params });
    this.logger.debug(`Notification created: ${params.type} → user=${params.userId}`);
    return notification;
  }

  // ── List own notifications ────────────────────────────────────────────────
  async findOwn(user: IJwtPayload, params: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const { skip, take, page, limit } = parsePagination(params);
    const where = {
      userId: user.sub,
      ...(params.unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.notification.count({ where }),
    ]);

    return { data: notifications, meta: buildMeta(total, page, limit) };
  }

  // ── Mark single notification as read ─────────────────────────────────────
  async markRead(id: string, user: IJwtPayload) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== user.sub) {
      throw new NotFoundException('Notification not found');
    }
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  // ── Mark ALL as read ──────────────────────────────────────────────────────
  async markAllRead(user: IJwtPayload) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId: user.sub, isRead: false },
      data:  { isRead: true },
    });
    return { message: `${count} notification${count !== 1 ? 's' : ''} marked as read` };
  }

  // ── Unread count (for badge) ──────────────────────────────────────────────
  async unreadCount(user: IJwtPayload): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId: user.sub, isRead: false },
    });
    return { count };
  }

  // ── Convenience wrappers — called by other services ───────────────────────

  notifyLessonSubmitted(adminId: string, instructorName: string, lessonTitle: string) {
    return this.create({
      userId:  adminId,
      type:    NotificationType.LESSON_SUBMITTED,
      title:   'Lesson submitted for review',
      message: `${instructorName} submitted "${lessonTitle}" for review.`,
      data:    { lessonTitle },
    });
  }

  notifyLessonApproved(instructorId: string, lessonTitle: string) {
    return this.create({
      userId:  instructorId,
      type:    NotificationType.LESSON_APPROVED,
      title:   'Lesson approved',
      message: `Your lesson "${lessonTitle}" has been approved and is now live.`,
      data:    { lessonTitle },
    });
  }

  notifyRevisionRequested(instructorId: string, lessonTitle: string, notes?: string) {
    return this.create({
      userId:  instructorId,
      type:    NotificationType.REVISION_REQUESTED,
      title:   'Revision requested',
      message: `Your lesson "${lessonTitle}" needs revisions.${notes ? ` Notes: ${notes}` : ''}`,
      data:    { lessonTitle, notes },
    });
  }

  notifyCourseCompleted(learnerId: string, courseTitle: string) {
    return this.create({
      userId:  learnerId,
      type:    NotificationType.COURSE_COMPLETED,
      title:   'Course completed! 🎉',
      message: `Congratulations! You have completed "${courseTitle}".`,
      data:    { courseTitle },
    });
  }

  notifyCertificateIssued(learnerId: string, courseTitle: string, verificationCode: string) {
    return this.create({
      userId:  learnerId,
      type:    NotificationType.CERTIFICATE_ISSUED,
      title:   'Certificate issued',
      message: `Your certificate for "${courseTitle}" is ready. Code: ${verificationCode}`,
      data:    { courseTitle, verificationCode },
    });
  }

  notifyAssignmentGraded(learnerId: string, lessonTitle: string, score: number) {
    return this.create({
      userId:  learnerId,
      type:    NotificationType.ASSIGNMENT_GRADED,
      title:   'Assignment graded',
      message: `Your assignment for "${lessonTitle}" has been graded: ${score}/100.`,
      data:    { lessonTitle, score },
    });
  }

  notifyPaymentConfirmed(learnerId: string, courseTitle: string) {
    return this.create({
      userId:  learnerId,
      type:    NotificationType.PAYMENT_CONFIRMED,
      title:   'Enrollment confirmed',
      message: `Payment confirmed. You are now enrolled in "${courseTitle}".`,
      data:    { courseTitle },
    });
  }
}
