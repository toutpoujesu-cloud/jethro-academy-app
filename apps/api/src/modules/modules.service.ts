import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class ModulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateModuleDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });
    if (!course) {
      throw new NotFoundException(`Course with id "${dto.courseId}" not found.`);
    }

    return this.prisma.module.create({
      data: {
        courseId: dto.courseId,
        title: dto.title,
        description: dto.description,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async findByCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with id "${courseId}" not found.`);
    }

    return this.prisma.module.findMany({
      where: { courseId },
      orderBy: { sortOrder: 'asc' },
      include: {
        lessons: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findOne(id: string) {
    const module = await this.prisma.module.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module with id "${id}" not found.`);
    }

    return module;
  }

  async update(id: string, dto: UpdateModuleDto) {
    const module = await this.prisma.module.findUnique({ where: { id } });
    if (!module) {
      throw new NotFoundException(`Module with id "${id}" not found.`);
    }

    if (dto.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
      });
      if (!course) {
        throw new NotFoundException(`Course with id "${dto.courseId}" not found.`);
      }
    }

    return this.prisma.module.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const module = await this.prisma.module.findUnique({ where: { id } });
    if (!module) {
      throw new NotFoundException(`Module with id "${id}" not found.`);
    }

    return this.prisma.module.delete({ where: { id } });
  }
}
