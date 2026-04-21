/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AcademicResourceService } from './academic-reseource.service';
import { AcademicResourceController } from './academic-reseource.controller';
import { ProcessingModule } from '../processing/processing.module';

@Module({
    imports: [ProcessingModule],
  controllers: [AcademicResourceController],
  providers: [AcademicResourceService],
})
export class AcademicResourceModule {}
