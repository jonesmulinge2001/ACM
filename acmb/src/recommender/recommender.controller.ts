/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { RecommenderService } from './recommender.service';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from '../decorator/permissions.decorator';
import { Permission } from '../permissions/permission.enum';
import { RequestWithUser } from '../interfaces/requestwithUser.interface';

@Controller('recommendations')
@UseGuards(AuthGuard('jwt'))
@RequirePermissions(Permission.CREATE_PROFILE)
export class RecommenderController {
  constructor(private readonly recommenderService: RecommenderService) {}

  @Get('user')
  async getRecommendations(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.recommenderService.recommend(userId);
  }

   // Endpoint for recommendSimilarPosts()
   @Get('post/:postId')
   async recommendSimilarPosts(@Param('postId') postId: string) {
     return this.recommenderService.recommendSimilarPosts(postId);
   }
}
