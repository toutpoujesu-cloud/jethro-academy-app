import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, LessonProgressStatus, ContentStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Enrollment report ─────────────────────────────────────────────────────
  async enrollments(params: { courseId?: string; from?: Date; to?: Date; page?: number; limit?: number }) {
    const { courseId, from, to, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(courseId ? { courseId } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        include: {
          user:   { select: { id: true, firstName: true, lastName: true, email: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return { data: records, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── Revenue report ────────────────────────────────────────────────────────
  async revenue(params: { from?: Date; to?: Date }) {
    const { from, to } = params;
    const where = {
      status: PaymentStatus.SUCCEEDED,
      ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    };

    const [payments, totalRevenue] = await Promise.all([
      this.prisma.payment.groupBy({
        by:      ['courseId'],
        where,
        _sum:    { amount: true },
        _count:  { _all: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.prisma.payment.aggregate({ where, _sum: { amount: true }, _count: { _all: true } }),
    ]);

    // Enrich with course names
    const courseIds = payments.map((p) => p.courseId);
    const courses = await this.prisma.course.findMany({
      where:  { id: { in: courseIds } },
      select: { id: true, title: true },
    });
    const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));

    return {
      totalRevenueCents: totalRevenue._sum.amount ?? 0,
      totalTransactions: totalRevenue._count._all,
      byCourse: payments.map((p) => ({
        courseId:    p.courseId,
        courseTitle: courseMap[p.courseId] ?? 'Unknown',
        revenueCents: p._sum.amount ?? 0,
        transactions: p._count._all,
      })),
    };
  }

  // ── Progress report ────────────────────────────────────────────────────────
  async progress(params: { courseId?: string }) {
    const { courseId } = params;

    const progressWhere = courseId
      ? { lesson: { module: { courseId } } }
      : {};

    const [completed, inProgress, notStarted, totalProgress] = await Promise.all([
      this.prisma.lessonProgress.count({ where: { ...progressWhere, status: LessonProgressStatus.COMPLETED } }),
      this.prisma.lessonProgress.count({ where: { ...progressWhere, status: LessonProgressStatus.IN_PROGRESS } }),
      this.prisma.lessonProgress.count({ where: { ...progressWhere, status: LessonProgressStatus.NOT_STARTED } }),
      this.prisma.lessonProgress.count({ where: progressWhere }),
    ]);

    const avgCompletion = totalProgress > 0
      ? Math.round((completed / totalProgress) * 100)
      : 0;

    // Assignments awaiting grade
    const pendingGrades = await this.prisma.lessonProgress.count({
      where: { assignmentSubmitted: true, gradedAt: null },
    });

    return { completed, inProgress, notStarted, total: totalProgress, avgCompletion, pendingGrades };
  }

  // ── Instructor report ──────────────────────────────────────────────────────
  async instructors() {
    const instructors = await this.prisma.user.findMany({
      where:   { role: 'INSTRUCTOR', deletedAt: null },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        assignedLessons: {
          select: { id: true, status: true },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    return instructors.map((i) => ({
      id:        i.id,
      name:      `${i.firstName} ${i.lastName}`,
      email:     i.email,
      lessons: {
        total:          i.assignedLessons.length,
        draft:          i.assignedLessons.filter((l) => l.status === ContentStatus.DRAFT).length,
        submitted:      i.assignedLessons.filter((l) => l.status === ContentStatus.SUBMITTED).length,
        revisionNeeded: i.assignedLessons.filter((l) => l.status === ContentStatus.REVISION_NEEDED).length,
        approved:       i.assignedLessons.filter((l) => l.status === ContentStatus.APPROVED).length,
      },
    }));
  }

  // ── Certificate report ─────────────────────────────────────────────────────
  async certificates(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = params;
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

  // ── Platform overview (Super Admin dashboard) ─────────────────────────────
  async overview() {
    const [
      totalUsers, totalLearners, totalInstructors,
      totalCourses, totalLessons,
      totalEnrollments, totalRevenue,
      totalCertificates, pendingReview, pendingGrades,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { role: 'LEARNER', deletedAt: null } }),
      this.prisma.user.count({ where: { role: 'INSTRUCTOR', deletedAt: null } }),
      this.prisma.course.count({ where: { status: ContentStatus.APPROVED } }),
      this.prisma.lesson.count({ where: { status: ContentStatus.APPROVED } }),
      this.prisma.enrollment.count(),
      this.prisma.payment.aggregate({ where: { status: PaymentStatus.SUCCEEDED }, _sum: { amount: true } }),
      this.prisma.certificate.count({ where: { status: 'ISSUED' } }),
      this.prisma.lesson.count({ where: { status: ContentStatus.SUBMITTED } }),
      this.prisma.lessonProgress.count({ where: { assignmentSubmitted: true, gradedAt: null } }),
    ]);

    return {
      users:        { total: totalUsers, learners: totalLearners, instructors: totalInstructors },
      content:      { courses: totalCourses, lessons: totalLessons, pendingReview },
      enrollments:  totalEnrollments,
      revenue:      { totalCents: totalRevenue._sum.amount ?? 0 },
      certificates: totalCertificates,
      pendingGrades,
    };
  }

  // ── CSV export helper ─────────────────────────────────────────────────────
  async exportCsv(type: 'enrollments' | 'revenue' | 'certificates'): Promise<string> {
    switch (type) {
      case 'enrollments': {
        const data = await this.enrollments({ limit: 10000 });
        const rows = [
          'Student Name,Email,Course,Source,Enrolled At',
          ...data.data.map((r) =>
            `"${r.user.firstName} ${r.user.lastName}","${r.user.email}","${r.course.title}","${r.source}","${r.createdAt.toISOString()}"`,
          ),
        ];
        return rows.join('\n');
      }
      case 'certificates': {
        const data = await this.certificates({ limit: 10000 });
        const rows = [
          'Student Name,Email,Course,Verification Code,Issued At',
          ...data.data.map((r) =>
            `"${r.user.firstName} ${r.user.lastName}","${r.user.email}","${r.course.title}","${r.verificationCode}","${r.issuedAt?.toISOString() ?? ''}"`,
          ),
        ];
        return rows.join('\n');
      }
      default:
        return 'Type,Amount\n';
    }
  }
}
