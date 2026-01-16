/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentService } from './comment.service';
import { RequestWithUser } from '../interfaces/requestwithUser.interface';
import { RequirePermissions } from '../decorator/permissions.decorator';
import { Permission } from '../permissions/permission.enum';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_COMMENT)
  async commentPost(
    @Req() req: RequestWithUser,
    @Body() body: { postId: string; content: string },
  ) {
    const userId = req.user.id;
    const { postId, content } = body;
    return this.commentService.commentPost(userId, postId, content);
  }

  @Get(':postId')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_PROFILE)
  async getComments(@Param('postId') postId: string) {
    return this.commentService.getCommentsForPost(postId);
  }

  @Get(':postId/count')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_COMMENT)
  getCommentCount(@Param('postId') postId: string) {
    return this.commentService.getCommentCount(postId);
  }

  //>>> edit comment
  @Patch(':commentId')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_COMMENT)
  async editComment(
    @Param('commentId') commentId: string,
    @Req() req: RequestWithUser,
    @Body() body: { content: string },
  ) {
    return this.commentService.editComment(
      commentId,
      req.user.id,
      body.content,
    );
  }

  //>>> delete comment
  @Delete(':commentId')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_COMMENT)
  async deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: RequestWithUser,
  ) {
    return (this, this.commentService.deleteComment(commentId, req.user.id));
  }

  @Post(':commentId/reply')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_COMMENT)
  async createReply(
    @Param('commentId') commentId: string,
    @Body() body: { text: string },
    @Req() req: RequestWithUser,
  ) {
    return this.commentService.createReply(commentId, body.text, req.user.id);
  }

  @Post(':commentId/like')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_COMMENT)
  likeComment(
    @Param('commentId') commentId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.commentService.likeComment(commentId, req.user.id);
  }

  @Delete(':commentId/unlike')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_COMMENT)
  unlikeComment(
    @Param('commentId') commentId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.commentService.unLikeComment(commentId, req.user.id);
  }

}
