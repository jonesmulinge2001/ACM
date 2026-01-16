/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
 
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
  } from '@nestjs/common';
  import { FollowService } from './follow.service';
  import { Permission } from '../permissions/permission.enum';
  import { AuthGuard } from '@nestjs/passport'; 
import { RequirePermissions } from '../decorator/permissions.decorator';
  
  @Controller('follow')
  @UseGuards(AuthGuard('jwt'))
  export class FollowController {
    constructor(private readonly followService: FollowService) {}
  
    @Post(':userId')
    @RequirePermissions(Permission.CREATE_PROFILE)
    async follow(@Param('userId') userId: string, @Request() req) {
      const followerId = req.user.id;
      return this.followService.followUser(followerId, userId);
    }
  
    @Delete(':userId')
    @RequirePermissions(Permission.CREATE_PROFILE)
    async unFollow(@Param('userId') userId: string, @Request() req) {
      const followerId = req.user.id;
      return this.followService.unfollowUser(followerId, userId);
    }
  
    @Get('followers/:userId')
    @RequirePermissions(Permission.CREATE_PROFILE)
    async getFollowers(@Param('userId') userId: string) {
      return this.followService.getFollowers(userId);
    }
  
    @Get('following/:userId')
    @RequirePermissions(Permission.CREATE_PROFILE)
    async getFollowing(@Param('userId') userId: string){
      return this.followService.getFollowing(userId);
    }

    @Get(':userId/stats')
    @RequirePermissions(Permission.CREATE_PROFILE)
    async getFollowStats(@Param('userId') userId: string) {
      const followers = await this.followService.getFollowersCount(userId);
      const following = await this.followService.getFollowingCount(userId);
      return { followers, following };  
    }
  }
  