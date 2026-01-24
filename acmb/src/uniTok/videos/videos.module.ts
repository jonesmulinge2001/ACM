import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { CloudinaryModule } from '../../shared/cloudinary/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
