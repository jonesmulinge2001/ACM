/* eslint-disable prettier/prettier */
 
 
/* eslint-disable prettier/prettier */
 
 
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from 'src/decorator/permissions.decorator';
import { Permission } from 'src/permissions/permission.enum';
import { RequestWithUser } from 'src/interfaces/requestwithUser.interface';
import { CreatePostDto } from 'src/dto/create-post.dto';
import { UpdatePostDto } from 'src/dto/update-post.dto';
import { PostType } from 'generated/prisma';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  //>>> create post
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  @UseInterceptors(FileInterceptor('file'))
  async createPost(
    @Req() req: RequestWithUser,
    @Body() dto: CreatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log('Received file:', file); 
    return this.postService.createPost(req.user.id, dto, file);
  }

  //>>> get all posts
  @Get()
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async getAllPosts() {
    return this.postService.getAllPosts();
  }

  //>>> get post by id
  @Get(':postId')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async getPostById(@Param('postId') postId: string) {
    return this.postService.getPostById(postId);
  }

  @Delete(':postId')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async deletePost(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
  ) {
    await this.postService.deletePost(req.user.id, postId);
    return { message: 'Post deleted successfully' };
  }

  @Patch(':postId')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async updatePost(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postService.updatePost(req.user.id, postId, dto);
  }

  @Get('general')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  getGeneralPosts() {
    return this.postService.getPostByType(PostType.GENERAL);
  }

  @Get('academic')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  getAcademicPosts() {
    return this.postService.getPostByType(PostType.ACADEMIC);
  }

  @Get('resource')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  getResourcePosts() {
    return this.postService.getPostByType(PostType.RESOURCE);
  }

  @Get('opportunity')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  getOpportunityPosts() {
    return this.postService.getPostByType(PostType.OPPORTUNITY);
  }

  // posts.controller.ts
@Get('trending')
@UseGuards(AuthGuard('jwt'))
@RequirePermissions(Permission.CREATE_POST)
async getTrending() {
  return this.postService.getTrendingPosts();
}

}
