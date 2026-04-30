import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({ description: 'Course UUID to purchase' })
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional({ example: 'GRACE50', description: 'Optional coupon code' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  couponCode?: string;

  @ApiPropertyOptional({ example: 'https://app.jethro.academy/courses' })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional({ example: 'https://app.jethro.academy/courses' })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class GrantAccessDto {
  @ApiProperty({ description: 'Student user UUID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Course UUID' })
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional({ example: 'Scholarship grant for pastoral training programme.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
