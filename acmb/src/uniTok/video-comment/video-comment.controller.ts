/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VideoCommentService } from './video-comment.service';
import { RequestWithUser } from '../../interfaces/requestwithUser.interface';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from '../../decorator/permissions.decorator';
import { Permission } from '../../permissions/permission.enum';

@UseGuards(AuthGuard('jwt'))
@RequirePermissions(Permission.CREATE_POST)
@Controller('video-comment')
export class VideoCommentController {
  constructor(private readonly videoCommentService: VideoCommentService) {}

  // CREATE
  @Post(':videoId')
  createComment(
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body('content') content: string,
    @Req() req: RequestWithUser,
  ) {
    return this.videoCommentService.create(videoId, req.user.id, content);
  }

  // GET BY VIDEO
  @Get('video/:videoId')
  getComments(@Param('videoId', ParseUUIDPipe) videoId: string) {
    return this.videoCommentService.findByVideo(videoId);
  }

  // UPDATE
  @Patch(':commentId')
  updateComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body('content') content: string,
    @Req() req: RequestWithUser,
  ) {
    return this.videoCommentService.update(commentId, req.user.id, content);
  }

  // DELETE
  @Delete(':commentId')
  deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.videoCommentService.remove(commentId, req.user.id);
  }
}
