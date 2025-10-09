/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PostFlag } from 'generated/prisma';
import { PostManagementService } from './post-management.service';

@Controller('post-management')
export class PostManagementController {
  constructor(private readonly postService: PostManagementService) {}

  // ----------------------------
  // Post Fetching
  // ----------------------------

  // ✅ Specific routes FIRST
  @Get('flagged')
  async getFlaggedPosts(): Promise<PostFlag[]> {
    return this.postService.getAllFlaggedPosts();
  }

  // ----------------------------
  // Post Moderation (Single)
  // ----------------------------

  @Patch('flag/:flagId/status')
  async updateFlagStatus(
    @Param('flagId') flagId: string,
    @Body('status') status: 'PENDING' | 'REVIEWED' | 'RESOLVED',
  ): Promise<PostFlag> {
    return this.postService.updateFlagStatus(flagId, status);
  }

  @Patch('flagged/:postId/delete')
  async softDeleteFlaggedPost(@Param('postId') postId: string) {
    return this.postService.softDeleteFlaggedPost(postId);
  }

  @Patch('flagged/:postId/restore')
  async restoreFlaggedPost(@Param('postId') postId: string) {
    return this.postService.restoreFlaggedPost(postId);
  }

  // ----------------------------
  // Bulk Moderation
  // ----------------------------

  @Post('bulk/delete')
  async bulkDelete(@Body('postIds') postIds: string[]) {
    return this.postService.bulkDeletePosts(postIds);
  }

  @Post('bulk/restore')
  async bulkRestore(@Body('postIds') postIds: string[]) {
    return this.postService.bulkRestorePosts(postIds);
  }

  @Post('bulk/remove-flags')
  async bulkRemoveFlags(@Body('postIds') postIds: string[]): Promise<PostFlag[]> {
    return this.postService.bulkRemoveFlags(postIds);
  }

  // ----------------------------
  // Generic routes LAST
  // ----------------------------

@Get()
async getAllPosts() {
  return this.postService.getAllPosts();
}

  @Get(':id')
  async getPost(@Param('id') postId: string) {
    return this.postService.getPostById(postId);
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') postId: string,
    @Body('action') action: 'DELETE' | 'RESTORE',
  ) {
    return this.postService.changeStatus(postId, action);
  }

  @Delete(':id')
  async deletePost(@Param('id') postId: string) {
    return this.postService.deletePost(postId);
  }
}
