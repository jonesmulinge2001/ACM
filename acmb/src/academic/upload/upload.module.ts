import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { CloudinaryModule } from '../../shared/cloudinary/cloudinary/cloudinary.module';
import { ProcessingModule } from '../processing/processing.module';

@Module({
  imports: [CloudinaryModule, ProcessingModule],
  providers: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
