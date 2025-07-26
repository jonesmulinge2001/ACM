/* eslint-disable prettier/prettier */
 
/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class LikeService {
  private prisma = new PrismaClient();

  async likePost(userId: string, postId: string) {
    //>>> add the like
    const ExistingLike = await this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    if(ExistingLike) {
      if(ExistingLike.deleted) {
        //>>> restore soft-deleted like
        await this.prisma.like.update({
          where: {
            id: ExistingLike.id },
            data: { deleted: false}
        });
        await this.prisma.interaction.create({
          data: {
            userId,
            postId,
            type: 'LIKE'
          }
        });

        return { message: 'Post re-liked'};
      } else {
        throw new BadRequestException('You already liked this post')
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
    return like
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
    const likes = this.prisma.like.findMany({
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
