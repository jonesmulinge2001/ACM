/* eslint-disable prettier/prettier */
 
 
/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class CommentService {
  private prisma = new PrismaClient();

  async commentPost(userId: string, postId: string, content: string) {
    //>>> add the comment
    const comment = await this.prisma.comment.create({
        data: {
            userId,
            postId,
            body: content,
        },
    });

    //>>> log the interaction
    await this.prisma.interaction.create({
        data: {
            userId,
            postId,
            type: 'COMMENT',
        },
    });

    return comment
  }

  async getCommentsForPost(postId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId, deleted: false },
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

    //>>> count total comments
    const total = await this.prisma.comment.count({
      where: { postId , deleted: false},
    });

    return {
      total,
      comments
    }
  }

  //>>> edit a comment
  async editComment(commentId: string, userId: string, content: string) {
    const existing = await this.prisma.comment.findUnique({
      where: { id: commentId, userId, deleted: false },
    });
    if(!existing || existing.userId !== userId) {
      throw new BadRequestException('You can only edit your own comment');
    }
    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId},
      data: { body: content}
    });
    return updatedComment;
  }

  //>>> delete comment
  async deleteComment(commentId: string, userId: string) {
    const existing = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if(!existing || existing.userId !== userId) {
      throw new BadRequestException('You can only delete your own comment');
    }
    return this.prisma.comment.update({
      where: { id: commentId },
      data: { deleted: true}
    });
  }
}
