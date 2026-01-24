import { Module } from '@nestjs/common';
import { AcademicResourceService } from './academic.service';
import { AcademicResourceController } from './academic.controller';
import { CloudinaryModule } from '../shared/cloudinary/cloudinary/cloudinary.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [CloudinaryModule, ConfigModule],
  providers: [AcademicResourceService],
  controllers: [AcademicResourceController],
})
export class AcademicResourceModule {}
