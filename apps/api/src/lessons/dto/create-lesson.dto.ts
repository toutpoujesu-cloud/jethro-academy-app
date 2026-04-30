import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LessonType } from '@prisma/client';

export class CreateLessonDto {
  @ApiProperty({
    description: 'UUID of the module this lesson belongs to',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  moduleId: string;

  @ApiProperty({
    description: 'Title of the lesson',
    maxLength: 200,
    example: 'Understanding Generic Constraints',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Optional description of the lesson content',
    example: 'In this lesson we explore how to constrain generic type parameters.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Type of lesson content',
    enum: LessonType,
    example: LessonType.VIDEO,
  })
  @IsEnum(LessonType)
  @IsNotEmpty()
  type: LessonType;

  @ApiPropertyOptional({
    description: 'Estimated time to complete the lesson in minutes',
    minimum: 1,
    example: 15,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  estimatedMins?: number;

  @ApiPropertyOptional({
    description: 'Sort order position within the module',
    minimum: 0,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'UUID of the instructor assigned to this lesson (set by Admin)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  instructorId?: string;
}
