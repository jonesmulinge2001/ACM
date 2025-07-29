/* eslint-disable prettier/prettier */
 
/* eslint-disable prettier/prettier */
 
 
 
/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class CommentLikeService {
  private prisma = new PrismaClient();

  async likeComment(userId: string, commentId: string) {
    //>>> prevent duplicate likes
    const existing = await this.prisma.commentLike.findFirst({
        where: { userId, commentId },
    });
    if (existing) {
        throw new BadRequestException('You already liked this comment');
    }
    return this.prisma.commentLike.create({
        data: { userId, commentId },
    });
  }

  //>>> get comment likes and total
  async getCommentLikes(commentId: string) {
    return await this.prisma.commentLike.findMany({
        where: { commentId },
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    profile: {
                        select: {
                            profileImage: true,
                            institution: true,
                        },
                    },
                },
            },
        },
    });
  }

  //>>> get total comment likes
  async totalCommentLikes(commentId: string) {
    return await this.prisma.commentLike.count({
        where: { commentId}
    });
  }
}
