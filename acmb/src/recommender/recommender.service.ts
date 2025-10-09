/* eslint-disable prettier/prettier */
 
/* eslint-disable prettier/prettier */
 
/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { intersection } from 'lodash';

@Injectable()
export class RecommenderService {
  private prisma = new PrismaClient();

  async recommend(userId: string) {
    const student = await this.prisma.profile.findUnique({ where: { userId } });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const otherProfiles = await this.prisma.profile.findMany({
      where: { NOT: { userId } },
    });

    const scoredProfiles = otherProfiles.map((profile) => {
      const skillMatch = intersection(student.skills, profile.skills).length;
      const interestMatch = intersection(
        student.interests,
        profile.interests,
      ).length;
      const institutionMatch =
        profile.institutionId === student.institutionId ? 1 : 0;
      const courseMatch = profile.course === student.course ? 1 : 0;

      const score =
        skillMatch * 3 + interestMatch * 2 + institutionMatch + courseMatch;

      return { profile, score };
    });

    const topProfiles = scoredProfiles
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((entry) => entry.profile);

    //>>> Build tag-based filter from skills and interests
    const tags = [...student.skills, ...student.interests];

    const postFilter = {
      tags: {
        some: {
          tag: {
            name: {
              in: tags,
            },
          },
        },
      },
    };

    const [resourcePosts, academicPosts, opportunityPosts, generalPosts] =
      await Promise.all([
        this.prisma.post.findMany({
          where: { type: 'RESOURCE', ...postFilter },
          take: 10,
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        }),
        this.prisma.post.findMany({
          where: { type: 'ACADEMIC', ...postFilter },
          take: 10,
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        }),
        this.prisma.post.findMany({
          where: { type: 'OPPORTUNITY', ...postFilter },
          take: 10,
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        }),
        this.prisma.post.findMany({
          where: { type: 'GENERAL', ...postFilter },
          take: 10,
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        }),
      ]);

    return {
      profiles: topProfiles,
      resources: {
        resource: resourcePosts,
        academic: academicPosts,
        opportunity: opportunityPosts,
        general: generalPosts,
      },
    };
  }

  //>>> recommend similar posts to a user
  async recommendSimilarPosts(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    const tagNames = post.tags.map((pt) => pt.tag.name);

    const similarPosts = await this.prisma.post.findMany({
      where: {
        id: { not: postId },
        type: post.type,
        tags: {
          some: {
            tag: {
              name: {
                in: tagNames,
              },
            },
          },
        },
      },
      take: 10,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return similarPosts;
  }
}
