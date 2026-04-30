import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'john@church.org' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'MyPass@2026!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}
