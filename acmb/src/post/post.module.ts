/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { CloudinaryModule } from 'src/shared/cloudinary/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  providers: [PostService],
  controllers: [PostController]
})
export class PostModule {}
