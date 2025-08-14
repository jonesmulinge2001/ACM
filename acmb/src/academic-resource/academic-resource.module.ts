import { Module } from '@nestjs/common';
import { AcademicResourceService } from './academic.service';
import { AcademicResourceController } from './academic.controller';
import { CloudinaryModule } from 'src/shared/cloudinary/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  providers: [AcademicResourceService],
  controllers: [AcademicResourceController],
})
export class AcademicResourceModule {}
