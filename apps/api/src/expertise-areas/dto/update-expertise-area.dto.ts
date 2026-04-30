import { PartialType } from '@nestjs/mapped-types';
import { CreateExpertiseAreaDto } from './create-expertise-area.dto';

export class UpdateExpertiseAreaDto extends PartialType(CreateExpertiseAreaDto) {}
