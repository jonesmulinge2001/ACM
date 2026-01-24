/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AcademicResourceService } from './academic-resource.service';
import { AcademicResourceController } from './academic-resource.controller';

@Module({
  providers: [AcademicResourceService],
  controllers: [AcademicResourceController]
})
export class AcademicResourceAdminModule {}
