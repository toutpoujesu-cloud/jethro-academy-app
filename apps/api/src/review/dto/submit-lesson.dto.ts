import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitLessonDto {
  @ApiPropertyOptional({ example: 'All content uploaded. Video, quiz and assignment ready for review.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
