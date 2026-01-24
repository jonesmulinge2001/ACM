/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import type { Express } from 'express';
import {
  AcademeetCloudinaryService,
  AcademeetUploadType,
} from '../../shared/cloudinary/cloudinary/cloudinary.service';
import { CreateUniTokVideoDto } from '../dtos/create-unitok-video.dto';
import { UpdateUniTokVideoDto } from '../dtos/update-unitok-video';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class VideosService {
  constructor(private cloudinaryService: AcademeetCloudinaryService) {}

  private prisma = new PrismaClient();

  // CREATE
  async createVideo(
    creatorId: string,
    data: CreateUniTokVideoDto & { videoUrl?: string },
    file?: Express.Multer.File,
  ) {
    let videoUrl = data.videoUrl;
  
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadMedia(file, AcademeetUploadType.POST_VIDEO);
      videoUrl = uploadResult.secure_url;
    }
  
    if (!videoUrl) {
      throw new BadRequestException('No video URL provided');
    }
  
    const tagsArray = Array.isArray(data.tags) 
    ? data.tags 
    : typeof data.tags === 'string' 
      ? JSON.parse(data.tags) 
      : [];
  
  return this.prisma.uniTokVideo.create({
    data: {
      creatorId,
      title: data.title,
      description: data.description || '',
      videoUrl,
      tags: tagsArray,
    },
  });
  }
  

  // GET ALL
  async getAllVideos() {
    return this.prisma.uniTokVideo.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // GET BY ID
  async getVideoById(id: string) {
    const video = await this.prisma.uniTokVideo.findUnique({
      where: { id },
    });
    if (!video) throw new NotFoundException('Video not found');
    return video;
  }

  // UPDATE
  async updateVideo(
    id: string,
    data: UpdateUniTokVideoDto,
    file?: Express.Multer.File,
  ) {
    const video = await this.prisma.uniTokVideo.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video not found');

    let videoUrl = video.videoUrl;
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadMedia(
        file,
        AcademeetUploadType.POST_VIDEO,
      );
      videoUrl = uploadResult.secure_url;
    }

    return this.prisma.uniTokVideo.update({
      where: { id },
      data: {
        ...data,
        videoUrl,
      },
    });
  }

  // DELETE
  async deleteVideo(id: string) {
    const video = await this.prisma.uniTokVideo.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video not found');

    return this.prisma.uniTokVideo.delete({ where: { id } });
  }
}
