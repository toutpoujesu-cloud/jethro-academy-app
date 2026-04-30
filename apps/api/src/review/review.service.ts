import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, ReviewAction, UserRole } from '@prisma/client';
import { IJwtPayload } from '@jethro/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewDecision, ReviewDecisionDto } from './dto/review-decision.dto';
import { SubmitLessonDto } from './dto/submit-lesson.dto';
import { parsePagination, buildMeta } from '../common/utils/pagination.util';

// ── Valid state transitions ─────────────────────────────────────────────────
const ALLOWED_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  [ContentStatus.DRAFT]:           [ContentStatus.SUBMITTED],
  [ContentStatus.SUBMITTED]:       [ContentStatus.APPROVED, ContentStatus.REVISION_NEEDED],
  [ContentStatus.REVISION_NEEDED]: [ContentStatus.SUBMITTED],  // Re-submit after revision
  [ContentStatus.APPROVED]:        [ContentStatus.ARCHIVED],
  [ContentStatus.ARCHIVED]:        [],
};

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Instructor: submit lesson for review ──────────────────────────────────
  async submitLesson(lessonId: string, dto: SubmitLessonDto, requester: IJwtPayload) {
    const lesson = await this.findLesson(lessonId);

    // Instructors can only submit their own lessons
    if (requester.role === UserRole.INSTRUCTOR && lesson.instructorId !== requester.sub) {
      throw new ForbiddenException('You can only submit your own lessons for review');
    }

    this.assertTransition(lesson.status, ContentStatus.SUBMITTED);

    const [updated] = await Promise.all([
      this.prisma.lesson.update({
        where: { id: lessonId },
        data:  { status: ContentStatus.SUBMITTED },
      }),
      this.logReview(lessonId, requester.sub, ReviewAction.SUBMITTED, dto.notes),
    ]);

    this.logger.log(`Lesson submitted for review: ${lessonId} by ${requester.email}`);
    return updated;
  }

  // ── Admin: get review queue (all SUBMITTED lessons) ───────────────────────
  async getQueue(params: { page?: number; limit?: number }) {
    const { skip, take, page, limit } = parsePagination(params);

    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where:   { status: ContentStatus.SUBMITTED },
        include: {
          module:      { include: { course: { include: { expertiseArea: true } } } },
          instructor:  { select: { id: true, firstName: true, lastName: true, email: true } },
          reviewLogs:  { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        skip,
        take,
        orderBy: { updatedAt: 'asc' }, // Oldest first (FIFO)
      }),
      this.prisma.lesson.count({ where: { status: ContentStatus.SUBMITTED } }),
    ]);

    return { data: lessons, meta: buildMeta(total, page, limit) };
  }

  // ── Admin: approve or request revision ────────────────────────────────────
  async decide(lessonId: string, dto: ReviewDecisionDto, requester: IJwtPayload) {
    const lesson = await this.findLesson(lessonId);

    if (lesson.status !== ContentStatus.SUBMITTED) {
      throw new BadRequestException(
        `Lesson must be in SUBMITTED status to review. Current status: ${lesson.status}`,
      );
    }

    const newStatus =
      dto.decision === ReviewDecision.APPROVE
        ? ContentStatus.APPROVED
        : ContentStatus.REVISION_NEEDED;

    const action =
      dto.decision === ReviewDecision.APPROVE
        ? ReviewAction.APPROVED
        : ReviewAction.REVISION_REQUESTED;

    const [updated] = await Promise.all([
      this.prisma.lesson.update({
        where: { id: lessonId },
        data:  { status: newStatus, revisionNotes: dto.notes ?? null },
      }),
      this.logReview(lessonId, requester.sub, action, dto.notes),
    ]);

    this.logger.log(
      `Lesson ${lessonId} → ${newStatus} by ${requester.email}${dto.notes ? ` (notes: ${dto.notes.substring(0, 60)}...)` : ''}`,
    );
    return updated;
  }

  // ── Admin: archive a lesson ───────────────────────────────────────────────
  async archive(lessonId: string, requester: IJwtPayload) {
    const lesson = await this.findLesson(lessonId);
    this.assertTransition(lesson.status, ContentStatus.ARCHIVED);

    const [updated] = await Promise.all([
      this.prisma.lesson.update({
        where: { id: lessonId },
        data:  { status: ContentStatus.ARCHIVED },
      }),
      this.logReview(lessonId, requester.sub, ReviewAction.ARCHIVED),
    ]);

    return updated;
  }

  // ── Get review history for a lesson ──────────────────────────────────────
  async getLessonHistory(lessonId: string) {
    await this.findLesson(lessonId);
    return this.prisma.reviewLog.findMany({
      where:   { lessonId },
      include: { reviewedBy: { select: { id: true, firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async findLesson(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  private assertTransition(from: ContentStatus, to: ContentStatus) {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Cannot transition lesson from ${from} to ${to}. Allowed transitions: ${allowed.join(', ') || 'none'}`,
      );
    }
  }

  private logReview(
    lessonId: string,
    reviewedById: string,
    action: ReviewAction,
    notes?: string,
  ) {
    return this.prisma.reviewLog.create({
      data: { lessonId, reviewedById, action, notes },
    });
  }
}
