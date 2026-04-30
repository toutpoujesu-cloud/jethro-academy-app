import { Module } from '@nestjs/common';
import { ExpertiseAreasController } from './expertise-areas.controller';
import { ExpertiseAreasService } from './expertise-areas.service';

@Module({
  controllers: [ExpertiseAreasController],
  providers:   [ExpertiseAreasService],
  exports:     [ExpertiseAreasService],
})
export class ExpertiseAreasModule {}
