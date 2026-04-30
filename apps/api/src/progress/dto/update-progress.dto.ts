import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

export class UpdateProgressDto {
  @ApiPropertyOptional({ example: 75, description: 'Watch percentage 0-100' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  watchPercentage?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  videoWatched?: boolean;

  // Quiz
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  quizSubmitted?: boolean;

  @ApiPropertyOptional({ example: 85.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  quizScore?: number;

  @ApiPropertyOptional({ description: 'Submitted quiz answers (JSON)' })
  @IsOptional()
  quizAnswers?: unknown;

  // Assignment
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  assignmentSubmitted?: boolean;

  @ApiPropertyOptional({ example: 'My reflection on servant leadership...' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  assignmentText?: string;

  @ApiPropertyOptional({ example: 'https://drive.google.com/...' })
  @IsOptional()
  @IsUrl()
  assignmentLinkUrl?: string;
}

export class GradeAssignmentDto {
  @ApiProperty({ example: 88, description: 'Score 0-100' })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiPropertyOptional({ example: 'Excellent reflection. Strong application of cross-shaped leadership.' })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  feedback?: string;
}
