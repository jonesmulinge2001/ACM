/* eslint-disable prettier/prettier */
 
 
/* eslint-disable prettier/prettier */
 
 
/* eslint-disable prettier/prettier */
 
import {
    BadRequestException,
    Injectable,
  } from '@nestjs/common';
  import { PrismaClient } from 'generated/prisma';
  
  @Injectable()
  export class FollowService {
    private prisma = new PrismaClient();
  
    async followUser(followerId: string, followingId: string) {
      if (followerId === followingId) {
        throw new BadRequestException('You cannot follow yourself');
      }
  
      const alreadyFollowing = await this.prisma.follow.findFirst({
        where: {
          followerId,
          followingId,
        },
      });
  
      if (alreadyFollowing) {
        throw new BadRequestException('You are already following this user');
      }
  
      return this.prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });
    }
  
    async unfollowUser(followerId: string, followingId: string) {
      return this.prisma.follow.deleteMany({
        where: {
          followerId,
          followingId,
        },
      });
    }
  
    async getFollowers(userId: string) {
      return this.prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            include: { profile: true },
          },
        },
      });
    }
  
    
    async getFollowing(userId: string) {
      return this.prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            include: { profile: true },
          },
        },
      });
    }
  }
  