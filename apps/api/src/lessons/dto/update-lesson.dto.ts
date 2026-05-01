import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import { CreateLessonDto } from './create-lesson.dto';

export class UpdateLessonDto extends PartialType(CreateLessonDto) {
  @ApiPropertyOptional({
    description: 'Publication status of the lesson',
    enum: ContentStatus,
    example: ContentStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({
    description: 'Notes from reviewer requesting revisions before publication',
    example: 'Please re-record the second half with better audio quality.',
  })
  @IsOptional()
  @IsString()
  revisionNotes?: string;
}
