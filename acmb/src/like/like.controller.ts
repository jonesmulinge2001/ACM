/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { LikeService } from './like.service';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithUser } from 'src/interfaces/requestwithUser.interface';
import { RequirePermissions } from 'src/decorator/permissions.decorator';
import { Permission } from 'src/permissions/permission.enum';

@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_PROFILE)
  async likePost(
    @Req() req: RequestWithUser,
    @Body() body: { postId: string; profileId: string }
  ) {
    const userId = req.user.id;
    const { postId } = body;
    return this.likeService.likePost(userId, postId);
  }

  @Get(':postId/likes')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async getLikes(@Param('postId') postId: string) {
    return this.likeService.getPostLikesWithTotal(postId);
  }

@Post('unlike')
@UseGuards(AuthGuard('jwt'))
@RequirePermissions(Permission.CREATE_PROFILE)
async unlikePost(
  @Req() req: RequestWithUser,
  @Body() body: { postId: string }
) {
  const userId = req.user.id;
  return this.likeService.unLikePost(userId, body.postId);
}
}
