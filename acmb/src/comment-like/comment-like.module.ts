import { Module } from '@nestjs/common';
import { CommentLikeService } from './comment-like.service';
import { CommentLikeController } from './comment-like.controller';

@Module({
  providers: [CommentLikeService],
  controllers: [CommentLikeController]
})
export class CommentLikeModule {}
