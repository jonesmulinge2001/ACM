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

  // GET /recommendations/user
  @Get('user')
  async getRecommendations(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.recommenderService.recommend(userId);
  }

  // GET /recommendations/post/:postId
  @Get('post/:postId')
  async recommendSimilarPosts(@Param('postId') postId: string) {
    return this.recommenderService.recommendSimilarPosts(postId);
  }

  // GET /recommendations/groups/skills
  @Get('groups/skills')
  async recommendGroupsBySkills(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.recommenderService.recommendGroupsBySkills(userId);
  }

  // GET /recommendations/profiles/skills
  @Get('profiles/skills')
  async suggestProfilesBySkills(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.recommenderService.suggestProfilesBySkills(userId);
  }

  // GET /recommendations/profiles/interests
  @Get('profiles/interests')
  async suggestProfilesByInterests(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.recommenderService.suggestProfilesByInterests(userId);
  }

  // GET /recommendations/profiles/course
  @Get('profiles/course')
  async suggestProfilesByCourse(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.recommenderService.suggestProfilesByCourse(userId);
  }

  // GET /recommendations/profiles/academic-level
  @Get('profiles/academic-level')
  async suggestProfilesByAcademicLevel(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.recommenderService.suggestProfilesByAcademicLevel(userId);
  }

  // GET /recommendations/profiles/institution
  @Get('profiles/institution')
  async suggestProfilesByInstitution(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.recommenderService.suggestProfilesByInstitution(userId);
  }
}