import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @ApiProperty({
    description: 'UUID of the expertise area this course belongs to',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  expertiseAreaId: string;

  @ApiProperty({
    description: 'Title of the course',
    maxLength: 200,
    example: 'Advanced TypeScript Patterns',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the course',
    example: 'Deep dive into advanced TypeScript patterns and best practices.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL of the course thumbnail image',
    format: 'url',
    example: 'https://cdn.jethro.academy/thumbnails/ts-advanced.jpg',
  })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: 'Price of the course in cents (e.g. 4999 = $49.99)',
    minimum: 0,
    default: 0,
    example: 4999,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  price?: number = 0;

  @ApiPropertyOptional({
    description: 'ISO 4217 currency code',
    default: 'usd',
    example: 'usd',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'usd';

  @ApiPropertyOptional({
    description: 'Sort order position among sibling courses',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}
