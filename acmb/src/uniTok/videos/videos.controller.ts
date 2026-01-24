/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideosService } from './videos.service';
import type { Express } from 'express';
import { CreateUniTokVideoDto } from '../dtos/create-unitok-video.dto';
import { UpdateUniTokVideoDto } from '../dtos/update-unitok-video';
import { RequestWithUser } from '../../interfaces/requestwithUser.interface';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from '../../decorator/permissions.decorator';
import { Permission } from '../../permissions/permission.enum';

@UseGuards(AuthGuard('jwt'))
@RequirePermissions(Permission.CREATE_POST)
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  // CREATE
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  createVideo(
    @Body() data: CreateUniTokVideoDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    return this.videosService.createVideo(req.user.id, data, file);
  }

  // GET ALL
  @Get()
  getAllVideos() {
    return this.videosService.getAllVideos();
  }

  // GET ONE
  @Get(':id')
  getVideoById(@Param('id', ParseUUIDPipe) id: string) {
    return this.videosService.getVideoById(id);
  }

  // UPDATE
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  updateVideo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateUniTokVideoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.videosService.updateVideo(id, data, file);
  }

  // DELETE
  @Delete(':id')
  deleteVideo(@Param('id', ParseUUIDPipe) id: string) {
    return this.videosService.deleteVideo(id);
  }
}
