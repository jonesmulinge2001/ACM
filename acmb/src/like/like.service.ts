/* eslint-disable prettier/prettier */
 
/* eslint-disable prettier/prettier */
 
/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class LikeService {
  private prisma = new PrismaClient();

  async likePost(userId: string, postId: string) {
    try {
      //>>> check if post exists
      const postExists = await this.prisma.post.findUnique({
        where: { id: postId }
      });
      if (!postExists) {
        throw new NotFoundException('Post not found');
      }
  
      //>>> check if existing like
      const existingLike = await this.prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
  
      if (existingLike) {
        if (existingLike.deleted) {
          //>>> restore soft-deleted like
          await this.prisma.like.update({
            where: { id: existingLike.id },
            data: { deleted: false },
          });
          await this.prisma.interaction.create({
            data: {
              userId,
              postId,
              type: 'LIKE'
            }
          });
  
          return { message: 'Post re-liked' };
        } else {
          throw new BadRequestException('You already liked this post');
        }
      }
  
      const like = await this.prisma.like.create({
        data: {
          userId,
          postId
        },
      });
  
      await this.prisma.interaction.create({
        data: {
          userId,
          postId,
          type: 'LIKE'
        }
      });
  
      return like;
    } catch (error) {
      console.error('Like error:', error);
      throw new BadRequestException('Something went wrong while liking post');
    }
  }
  

  //>>> unlike post
  async unLikePost(userId: string, postId: string) {
    const existingLike = await this.prisma.like.findFirst({
      where: {
        userId,
        postId,
        deleted: false,
      }
    });
    if(!existingLike) {
      throw new BadRequestException('Like not found or already unliked');
    }
    await this.prisma.like.update({
      where: { id: existingLike.id},
      data: { deleted: true},
    });

    await this.prisma.interaction.deleteMany({
      where: {
        userId,
        postId,
        type: 'LIKE'
      }
    });
    return { message: 'Post unliked'};
  }

  async getPostLikesWithTotal(postId: string) {
    const likes = await this.prisma.like.findMany({
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
                course: true,
                institution: true,
              },
            },
          },
        },
      },
    });

    //>>> count likes
    const total = await this.prisma.like.count({
      where: { postId, deleted: false },
    });

    return {
      total,
      likes,
    };
  }
}
