/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class VideoCommentService {
  constructor() {}
  private prisma = new PrismaClient();

  // CREATE COMMENT
  async create(videoId: string, userId: string, content: string) {
    const video = await this.prisma.uniTokVideo.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.uniTokComment.create({
        data: {
          content,
          videoId,
          authorId: userId,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  profileImage: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.uniTokVideo.update({
        where: { id: videoId },
        data: {
          commentsCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return comment;
  }

  // GET COMMENTS BY VIDEO
  async findByVideo(videoId: string) {
    return this.prisma.uniTokComment.findMany({
      where: { videoId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                profileImage: true,
              },
            },
          },
        },
      },
    });
  }

  // UPDATE COMMENT
  async update(commentId: string, userId: string, content: string) {
    const comment = await this.prisma.uniTokComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comment');
    }

    return this.prisma.uniTokComment.update({
      where: { id: commentId },
      data: { content },
    });
  }

  // DELETE COMMENT
  async remove(commentId: string, userId: string) {
    const comment = await this.prisma.uniTokComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comment');
    }

    await this.prisma.$transaction([
      this.prisma.uniTokComment.delete({
        where: { id: commentId },
      }),
      this.prisma.uniTokVideo.update({
        where: { id: comment.videoId },
        data: {
          commentsCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    return {
      message: 'Comment deleted successfully',
    };
  }
}
