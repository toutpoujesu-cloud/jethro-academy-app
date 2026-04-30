import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class InviteInstructorDto {
  @ApiProperty({ example: 'dr.john@seminary.org' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Dr. John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Calvin' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'Systematic theology and church history specialist.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}
