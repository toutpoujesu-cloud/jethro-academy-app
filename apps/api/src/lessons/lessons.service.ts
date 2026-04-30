import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, UserRole } from '@prisma/client';
import { IJwtPayload } from '@jethro/shared';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../common/utils/slug.util';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLessonDto) {
    const module = await this.prisma.module.findUnique({
      where: { id: dto.moduleId },
    });
    if (!module) {
      throw new NotFoundException(`Module with id "${dto.moduleId}" not found.`);
    }

    const slug = generateSlug(dto.title);

    const slugConflict = await this.prisma.lesson.findFirst({
      where: { moduleId: dto.moduleId, slug },
    });
    if (slugConflict) {
      throw new ConflictException(
        `A lesson with the slug "${slug}" already exists in this module. Please choose a different title.`,
      );
    }

    if (dto.instructorId) {
      await this.verifyInstructorExists(dto.instructorId);
    }

    return this.prisma.lesson.create({
      data: {
        moduleId: dto.moduleId,
        title: dto.title,
        slug,
        description: dto.description,
        type: dto.type,
        estimatedMins: dto.estimatedMins,
        sortOrder: dto.sortOrder,
        instructorId: dto.instructorId,
        status: ContentStatus.DRAFT,
      },
    });
  }

  async findByModule(moduleId: string) {
    const module = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException(`Module with id "${moduleId}" not found.`);
    }

    return this.prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: true,
        quiz: true,
        assignment: true,
        resources: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with id "${id}" not found.`);
    }

    return lesson;
  }

  async update(id: string, dto: UpdateLessonDto, requester: IJwtPayload) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) {
      throw new NotFoundException(`Lesson with id "${id}" not found.`);
    }

    const isAdmin =
      requester.role === UserRole.ADMIN ||
      requester.role === UserRole.SUPER_ADMIN;
    const isOwnLesson = lesson.instructorId === requester.sub;

    if (!isAdmin && !isOwnLesson) {
      throw new ForbiddenException(
        'You do not have permission to update this lesson.',
      );
    }

    const data: Record<string, unknown> = { ...dto };

    if (dto.title && dto.title !== lesson.title) {
      const newSlug = generateSlug(dto.title);
      const slugConflict = await this.prisma.lesson.findFirst({
        where: { moduleId: lesson.moduleId, slug: newSlug, id: { not: id } },
      });
      if (slugConflict) {
        throw new ConflictException(
          `A lesson with the slug "${newSlug}" already exists in this module. Please choose a different title.`,
        );
      }
      data.slug = newSlug;
    }

    if (dto.instructorId && dto.instructorId !== lesson.instructorId) {
      await this.verifyInstructorExists(dto.instructorId);
    }

    return this.prisma.lesson.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) {
      throw new NotFoundException(`Lesson with id "${id}" not found.`);
    }

    return this.prisma.lesson.delete({ where: { id } });
  }

  async assignInstructor(lessonId: string, instructorId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException(`Lesson with id "${lessonId}" not found.`);
    }

    await this.verifyInstructorExists(instructorId);

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: { instructorId },
    });
  }

  private async verifyInstructorExists(instructorId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: instructorId },
    });

    if (!user) {
      throw new NotFoundException(`User with id "${instructorId}" not found.`);
    }

    if (user.role !== UserRole.INSTRUCTOR) {
      throw new ForbiddenException(
        `User "${instructorId}" does not have the INSTRUCTOR role.`,
      );
    }
  }
}
