/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from 'src/decorator/permissions.decorator';
import { RequestWithUser } from 'src/interfaces/requestwithUser.interface';
import { Permission } from 'src/permissions/permission.enum';
import { CommentLikeService } from './comment-like.service';

@Controller('comment-like')
export class CommentLikeController {
  constructor(private readonly commentLikeService: CommentLikeService) {}

  //>>> like a comment
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async likeComment(
    @Req() req: RequestWithUser,
    @Body() body: { commentId: string}
  ) {
    const userId = req.user.id;
    return this.commentLikeService.likeComment(userId, body.commentId);
  }

  //>>>get comment likes
  @Get(':commentId/likes')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async getLikes(@Param('commentId') commentId: string) {
    return this.commentLikeService.getCommentLikes(commentId)
  }

  //>>> get total likes count
  @Get(':commentId/likes/count')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async getTotalLikes(@Param('commentId') commentId: string) {
    return this.commentLikeService.totalCommentLikes(commentId);
  }
}
