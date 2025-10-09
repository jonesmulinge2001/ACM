/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

    // fetch enriched comment with user and profile
    const enrichedComment = await this.prisma.comment.findUnique({
      where: { id: comment.id },
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

    return enrichedComment;
  }

  async getCommentsForPost(postId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId, parentId: null, deleted: false }, // only top-level comments
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
        replies: {
          where: { deleted: false },
          orderBy: { createdAt: 'asc' },
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
        },
        _count: {
          select: { likes: true },
        },
      },
    });
  
    const total = await this.prisma.comment.count({
      where: { postId, parentId: null, deleted: false },
    });
  
    return {
      total,
      comments,
    };
  }
  

  //>>> edit a comment
  async editComment(commentId: string, userId: string, content: string) {
    const existing = await this.prisma.comment.findUnique({
      where: { id: commentId, userId, deleted: false },
    });
    if (!existing || existing.userId !== userId) {
      throw new BadRequestException('You can only edit your own comment');
    }
    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: { body: content },
    });
    return updatedComment;
  }

  //>>> delete comment
  async deleteComment(commentId: string, userId: string) {
    const existing = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!existing || existing.userId !== userId) {
      throw new BadRequestException('You can only delete your own comment');
    }
    return this.prisma.comment.update({
      where: { id: commentId },
      data: { deleted: true },
    });
  }

  async getCommentCount(postId: string): Promise<{ total: number }> {
    const total = await this.prisma.comment.count({
      where: { postId },
    });
  
    return { total };
  }

  async createReply(commentId: string, text: string, userId: string) {
    const parent = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { postId: true },
    });
  
    if (!parent?.postId) {
      throw new Error('Original comment is missing a postId.');
    }
  
    return this.prisma.comment.create({
      data: {
        body: text,
        userId,
        parentId: commentId,
        postId: parent.postId,
      },
      include: {
        user: true,
      },
    });
  }
  

  async likeComment(commentId: string, userId: string) {
    return this.prisma.commentLike.upsert({
      where: { userId_commentId: { userId, commentId } },
      create: { commentId, userId },
      update: {},
    });
  }
  

  async unLikeComment(commentId: string, userId: string) {
    try {
      return await this.prisma.commentLike.delete({
        where: { userId_commentId: { userId, commentId } },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return { message: 'No like found to remove.' };
      }
      throw error;
    }
  }
  
  async hasUserLiked(commentId: string, userId: string) {
    const existing = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId}}
    });
    return !!existing;
  }

  async getCommentLikeCount(commentId: string) {
    const count = await this.prisma.commentLike.count({
      where: { commentId}
    });
    return count;
  }

}
