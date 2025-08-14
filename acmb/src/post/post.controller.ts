/* eslint-disable prettier/prettier */
 
/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async getAllPosts(@Req() req: RequestWithUser) {
    return this.postService.getAllPosts(req.user.id);
  }

  @Get('trending')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async getTrending(@Req() req: RequestWithUser) {
    return this.postService.getTrendingPosts(req.user.id); 
  }

  
  @Get('infinite')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async getInfinite(
    @Req() req: RequestWithUser,
    @Query('limit') limit = 10,
    @Query('cursor') cursor?: string,
  ) {
    return this.postService.getInfinitePosts(req.user.id, Number(limit), cursor);
  }

  @Get(':postId')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async getPostById(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
  ) {
    return this.postService.getPostById(postId, req.user.id);
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
  @UseInterceptors(FileInterceptor('file')) 
  async updatePost(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
    @UploadedFile() file: Express.Multer.File, 
    @Body() dto: UpdatePostDto,
  ) {
    // Parse tags if they come as JSON string
    if (typeof dto.tags === 'string') {
      // Single tag in FormData
      dto.tags = [dto.tags];
    } else if (Array.isArray(dto.tags)) {
      // Already an array, do nothing
    } else if (dto.tags) {
      throw new BadRequestException('Invalid tags format');
    }
    
  
    return this.postService.updatePost(req.user.id, postId, dto, file);
  }
  

  @Get('general')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  getGeneralPosts(@Req() req: RequestWithUser) {
    return this.postService.getPostByType(PostType.GENERAL, req.user.id);
  }

  @Get('academic')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  getAcademicPosts(@Req() req: RequestWithUser) {
    return this.postService.getPostByType(PostType.ACADEMIC, req.user.id);
  }

  @Get('resource')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  getResourcePosts(@Req() req: RequestWithUser) {
    return this.postService.getPostByType(PostType.RESOURCE, req.user.id);
  }

  @Get('opportunity')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  getOpportunityPosts(@Req() req: RequestWithUser) {
    return this.postService.getPostByType(PostType.OPPORTUNITY, req.user.id);
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async getPostsByUser(
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ) {
    const currentUserId = req.user.id;
    return this.postService.getPostsByUser(userId, currentUserId);
  }

  

}
