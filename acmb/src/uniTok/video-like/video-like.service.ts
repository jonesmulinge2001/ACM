/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class VideoLikeService {
  constructor() {}
  private prisma = new PrismaClient();

  // LIKE A VIDEO
  async likeVideo(videoId: string, userId: string) {
    const video = await this.prisma.uniTokVideo.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const alreadyLiked = await this.prisma.uniTokVideoLike.findUnique({
      where: {
        videoId_userId: {
          videoId,
          userId,
        },
      },
    });

    if (alreadyLiked) {
      throw new ConflictException('Video already liked');
    }

    await this.prisma.$transaction([
      this.prisma.uniTokVideoLike.create({
        data: {
          videoId,
          userId,
        },
      }),
      this.prisma.uniTokVideo.update({
        where: { id: videoId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return {
      message: 'Video liked successfully',
    };
  }

  // UNLIKE A VIDEO
  async unlikeVideo(videoId: string, userId: string) {
    const like = await this.prisma.uniTokVideoLike.findUnique({
      where: {
        videoId_userId: {
          videoId,
          userId,
        },
      },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    await this.prisma.$transaction([
      this.prisma.uniTokVideoLike.delete({
        where: {
          videoId_userId: {
            videoId,
            userId,
          },
        },
      }),
      this.prisma.uniTokVideo.update({
        where: { id: videoId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    return {
      message: 'Video unliked successfully',
    };
  }

  // CHECK IF USER LIKED A VIDEO
  async hasUserLiked(videoId: string, userId: string) {
    const like = await this.prisma.uniTokVideoLike.findUnique({
      where: {
        videoId_userId: {
          videoId,
          userId,
        },
      },
    });

    return {
      liked: !!like,
    };
  }
}
