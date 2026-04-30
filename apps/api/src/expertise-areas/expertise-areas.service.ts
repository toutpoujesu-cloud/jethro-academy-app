import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpertiseAreaDto } from './dto/create-expertise-area.dto';
import { UpdateExpertiseAreaDto } from './dto/update-expertise-area.dto';
import { generateSlug } from '../common/utils/slug.util';

@Injectable()
export class ExpertiseAreasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExpertiseAreaDto) {
    const slug = generateSlug(dto.name);
    const existing = await this.prisma.expertiseArea.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('An expertise area with this name already exists');

    return this.prisma.expertiseArea.create({
      data: { ...dto, slug },
    });
  }

  async findAll() {
    return this.prisma.expertiseArea.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { courses: true } } },
    });
  }

  async findOne(id: string) {
    const area = await this.prisma.expertiseArea.findUnique({
      where: { id },
      include: { courses: { where: { status: 'APPROVED' }, orderBy: { sortOrder: 'asc' } } },
    });
    if (!area) throw new NotFoundException('Expertise area not found');
    return area;
  }

  async update(id: string, dto: UpdateExpertiseAreaDto) {
    await this.findOne(id);
    const data: typeof dto & { slug?: string } = { ...dto };
    if (dto.name) data.slug = generateSlug(dto.name);
    return this.prisma.expertiseArea.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.expertiseArea.delete({ where: { id } });
    return { message: 'Expertise area deleted' };
  }
}
