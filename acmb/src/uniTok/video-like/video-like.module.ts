import { Module } from '@nestjs/common';
import { VideoLikeController } from './video-like.controller';
import { VideoLikeService } from './video-like.service';

@Module({
  controllers: [VideoLikeController],
  providers: [VideoLikeService],
})
export class VideoLikeModule {}
