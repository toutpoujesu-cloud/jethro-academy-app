import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../common/utils/slug.util';
import { buildMeta, parsePagination } from '../common/utils/pagination.util';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

export interface FindAllCoursesParams {
  expertiseAreaId?: string;
  status?: ContentStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    const slug = generateSlug(dto.title);

    const existing = await this.prisma.course.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(
        `A course with the slug "${slug}" already exists. Please choose a different title.`,
      );
    }

    return this.prisma.course.create({
      data: {
        expertiseAreaId: dto.expertiseAreaId,
        title: dto.title,
        slug,
        description: dto.description,
        thumbnailUrl: dto.thumbnailUrl,
        price: dto.price ?? 0,
        currency: dto.currency ?? 'usd',
        sortOrder: dto.sortOrder,
        status: ContentStatus.DRAFT,
      },
    });
  }

  async findAll(params: FindAllCoursesParams) {
    const { skip, take } = parsePagination({
      page: params.page,
      limit: params.limit,
    });

    const where: Record<string, unknown> = {};
    if (params.expertiseAreaId) {
      where.expertiseAreaId = params.expertiseAreaId;
    }
    if (params.status) {
      where.status = params.status;
    }

    const [total, items] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          _count: {
            select: { modules: true },
          },
        },
      }),
    ]);

    return {
      items,
      meta: buildMeta(total, params.page ?? 1, params.limit ?? 10),
    };
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with id "${id}" not found.`);
    }

    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException(`Course with id "${id}" not found.`);
    }

    const data: Record<string, unknown> = { ...dto };

    if (dto.title && dto.title !== course.title) {
      const newSlug = generateSlug(dto.title);
      const slugConflict = await this.prisma.course.findFirst({
        where: { slug: newSlug, id: { not: id } },
      });
      if (slugConflict) {
        throw new ConflictException(
          `A course with the slug "${newSlug}" already exists. Please choose a different title.`,
        );
      }
      data.slug = newSlug;
    }

    return this.prisma.course.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException(`Course with id "${id}" not found.`);
    }

    return this.prisma.course.delete({ where: { id } });
  }
}
