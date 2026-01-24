import { Module } from '@nestjs/common';
import { VideoCommentController } from './video-comment.controller';
import { VideoCommentService } from './video-comment.service';

@Module({
  controllers: [VideoCommentController],
  providers: [VideoCommentService],
})
export class VideoCommentModule {}
