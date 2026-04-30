import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ReviewDecision {
  APPROVE           = 'APPROVE',
  REQUEST_REVISION  = 'REQUEST_REVISION',
}

export class ReviewDecisionDto {
  @ApiProperty({ enum: ReviewDecision })
  @IsEnum(ReviewDecision)
  decision: ReviewDecision;

  @ApiPropertyOptional({ example: 'Please add a quiz question on justification by faith.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
