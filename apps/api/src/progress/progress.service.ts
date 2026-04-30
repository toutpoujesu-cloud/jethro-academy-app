import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { LessonProgressStatus, UserRole } from '@prisma/client';
import { IJwtPayload } from '@jethro/shared';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProgressDto, GradeAssignmentDto } from './dto/update-progress.dto';

const VIDEO_COMPLETION_THRESHOLD = 90; // % watched to mark video complete

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Update progress (learner reports watch %, quiz, assignment) ───────────
  async updateProgress(lessonId: string, dto: UpdateProgressDto, user: IJwtPayload) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    // Determine video watched
    const videoWatched =
      dto.videoWatched ??
      ((dto.watchPercentage ?? 0) >= VIDEO_COMPLETION_THRESHOLD ? true : undefined);

    const submittedAt =
      dto.assignmentSubmitted || dto.quizSubmitted ? new Date() : undefined;

    const progress = await this.prisma.lessonProgress.upsert({
      where:  { userId_lessonId: { userId: user.sub, lessonId } },
      create: {
        userId:   user.sub,
        lessonId,
        status:   LessonProgressStatus.IN_PROGRESS,
        ...this.buildProgressData(dto, videoWatched, submittedAt),
      },
      update: {
        ...this.buildProgressData(dto, videoWatched, submittedAt),
      },
    });

    // Check if lesson is now complete and update status
    const updated = await this.checkCompletion(progress.id);

    this.logger.debug(`Progress updated: user=${user.sub} lesson=${lessonId}`);
    return updated;
  }

  // ── Get all progress for a learner on a course ────────────────────────────
  async getCourseProgress(courseId: string, user: IJwtPayload) {
    const course = await this.prisma.course.findUnique({
      where:   { id: courseId },
      include: {
        modules: {
          include: { lessons: { select: { id: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));

    const progressRecords = await this.prisma.lessonProgress.findMany({
      where: { userId: user.sub, lessonId: { in: lessonIds } },
    });

    const progressMap = Object.fromEntries(progressRecords.map((p) => [p.lessonId, p]));
    const completedCount = progressRecords.filter(
      (p) => p.status === LessonProgressStatus.COMPLETED,
    ).length;

    return {
      courseId,
      totalLessons:    lessonIds.length,
      completedLessons: completedCount,
      overallPercent:  lessonIds.length
        ? Math.round((completedCount / lessonIds.length) * 100)
        : 0,
      lessons: lessonIds.map((id) => ({
        lessonId: id,
        progress: progressMap[id] ?? null,
      })),
    };
  }

  // ── Instructor/Admin: grade an assignment ─────────────────────────────────
  async gradeAssignment(
    lessonId:   string,
    studentId:  string,
    dto:        GradeAssignmentDto,
    grader:     IJwtPayload,
  ) {
    const progressRecord = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: studentId, lessonId } },
    });

    if (!progressRecord) throw new NotFoundException('No submission found for this student and lesson');
    if (!progressRecord.assignmentSubmitted) {
      throw new NotFoundException('Student has not submitted an assignment for this lesson');
    }

    // Instructors can only grade their own lessons
    if (grader.role === UserRole.INSTRUCTOR) {
      const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
      if (lesson?.instructorId !== grader.sub) {
        throw new ForbiddenException('You can only grade assignments for your own lessons');
      }
    }

    const updated = await this.prisma.lessonProgress.update({
      where: { userId_lessonId: { userId: studentId, lessonId } },
      data:  {
        assignmentScore:    dto.score,
        assignmentFeedback: dto.feedback,
        gradedAt:           new Date(),
        gradedById:         grader.sub,
      },
    });

    this.logger.log(`Assignment graded: student=${studentId} lesson=${lessonId} score=${dto.score} by=${grader.email}`);
    return updated;
  }

  // ── Admin: get all submissions awaiting grading ────────────────────────────
  async getPendingGrades(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      this.prisma.lessonProgress.findMany({
        where:   { assignmentSubmitted: true, gradedAt: null },
        include: {
          user:   { select: { id: true, firstName: true, lastName: true, email: true } },
          lesson: { select: { id: true, title: true, module: { include: { course: true } } } },
        },
        orderBy: { submittedAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.lessonProgress.count({ where: { assignmentSubmitted: true, gradedAt: null } }),
    ]);

    return {
      data: records,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private buildProgressData(
    dto:          UpdateProgressDto,
    videoWatched: boolean | undefined,
    submittedAt:  Date | undefined,
  ) {
    return {
      ...(dto.watchPercentage  !== undefined && { watchPercentage: dto.watchPercentage }),
      ...(videoWatched         !== undefined && { videoWatched }),
      ...(dto.quizSubmitted    !== undefined && { quizSubmitted: dto.quizSubmitted }),
      ...(dto.quizScore        !== undefined && { quizScore: dto.quizScore }),
      ...(dto.quizAnswers      !== undefined && { quizAnswers: dto.quizAnswers }),
      ...(dto.assignmentSubmitted !== undefined && { assignmentSubmitted: dto.assignmentSubmitted }),
      ...(dto.assignmentText   !== undefined && { assignmentText: dto.assignmentText }),
      ...(dto.assignmentLinkUrl !== undefined && { assignmentLinkUrl: dto.assignmentLinkUrl }),
      ...(submittedAt && { submittedAt }),
    };
  }

  private async checkCompletion(progressId: string) {
    const p = await this.prisma.lessonProgress.findUniqueOrThrow({ where: { id: progressId } });

    const isComplete =
      p.videoWatched &&
      p.quizSubmitted &&
      p.assignmentSubmitted;

    if (isComplete && p.status !== LessonProgressStatus.COMPLETED) {
      return this.prisma.lessonProgress.update({
        where: { id: progressId },
        data:  { status: LessonProgressStatus.COMPLETED, completedAt: new Date() },
      });
    }

    return p;
  }
}
