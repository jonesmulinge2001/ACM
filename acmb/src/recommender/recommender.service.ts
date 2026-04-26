/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { intersection } from 'lodash';

@Injectable()
export class RecommenderService {
  private prisma = new PrismaClient();

  async recommend(userId: string) {
    const student = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException(`User with this id ${userId} was not found`);
    }

    // 🔥 BEHAVIOR SIGNALS (NEW)
    const profileViews = await this.prisma.profileView.findMany({
      where: { viewerId: userId },
    });

    const viewedUsers = new Set(profileViews.map(v => v.viewedId));

    const otherProfiles = await this.prisma.profile.findMany({
      where: { NOT: { userId } },
    });

    const scoredProfiles = otherProfiles.map((profile) => {
      // --- BASE MATCHING ---
      const skillMatch = intersection(student.skills, profile.skills).length;
      const interestMatch = intersection(
        student.interests,
        profile.interests,
      ).length;

      const institutionMatch =
        profile.institutionId === student.institutionId ? 1 : 0;

      const courseMatch = profile.course === student.course ? 1 : 0;

      // --- BASE SCORE ---
      let score =
        skillMatch * 3 +
        interestMatch * 2 +
        institutionMatch +
        courseMatch;

      // --- BEHAVIOR BOOST (NEW INTELLIGENCE LAYER) ---
      if (viewedUsers.has(profile.userId)) {
        score += 2; // user showed interest before
      }

      return { profile, score };
    });

    const topProfiles = scoredProfiles
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((entry) => entry.profile);

    // --- TAG SYSTEM (UNCHANGED) ---
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

    const [
      resourcePosts,
      academicPosts,
      opportunityPosts,
      generalPosts,
    ] = await Promise.all([
      this.prisma.post.findMany({
        where: { type: 'RESOURCE', ...postFilter },
        take: 10,
        include: {
          tags: {
            include: { tag: true },
          },
        },
      }),

      this.prisma.post.findMany({
        where: { type: 'ACADEMIC', ...postFilter },
        take: 10,
        include: {
          tags: {
            include: { tag: true },
          },
        },
      }),

      this.prisma.post.findMany({
        where: { type: 'OPPORTUNITY', ...postFilter },
        take: 10,
        include: {
          tags: {
            include: { tag: true },
          },
        },
      }),

      this.prisma.post.findMany({
        where: { type: 'GENERAL', ...postFilter },
        take: 10,
        include: {
          tags: {
            include: { tag: true },
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

  // >>> recommend similar posts to a user
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

    if (!post)
      throw new NotFoundException(`Post with this id ${postId} was not found`);

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

  // >>> recommend / suggest groups to join based on skills
  async recommendGroupsBySkills(userId: string) {
    const student = await this.prisma.profile.findUnique({ where: { userId } });

    if (!student) {
      throw new NotFoundException(`User with this id ${userId} was not found`);
    }

    // Fetch all non-deleted public groups the user has NOT already joined,
    // including their members' profiles so we can score by skill overlap
    const groups = await this.prisma.group.findMany({
      where: {
        isDeleted: false,
        visibility: 'PUBLIC',
        members: {
          none: {
            userId,
            isDeleted: false,
          },
        },
      },
      include: {
        members: {
          where: { isDeleted: false },
          include: {
            user: {
              include: {
                profile: {
                  select: { skills: true },
                },
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    // Score each group by how many of its members share skills with the student.
    // This surfaces groups where the student would find peers with relevant skills.
    const scoredGroups = groups
      .map((group) => {
        const memberSkills = group.members.flatMap(
          (m) => m.user.profile?.skills ?? [],
        );
        const matchCount = intersection(student.skills, memberSkills).length;
        return { group, matchCount };
      })
      .filter((entry) => entry.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 10)
      .map((entry) => entry.group);

    return scoredGroups;
  }

  // >>> suggest profiles based on skills alone
  async suggestProfilesBySkills(userId: string) {
    const student = await this.prisma.profile.findUnique({ where: { userId }, include: { institution: {
      select: { id: true, name: true}
    } } });

    if (!student) {
      throw new NotFoundException(`User with this id ${userId} was not found`);
    }

    const otherProfiles = await this.prisma.profile.findMany({
      where: { NOT: { userId } },
    });

    const scoredProfiles = otherProfiles
      .map((profile) => {
        const skillMatch = intersection(student.skills, profile.skills).length;
        return { profile, skillMatch };
      })
      .filter((entry) => entry.skillMatch > 0)
      .sort((a, b) => b.skillMatch - a.skillMatch)
      .slice(0, 10)
      .map((entry) => entry.profile);

    return scoredProfiles;
  }

  // >>> suggest profiles based on interests alone
  async suggestProfilesByInterests(userId: string) {
    const student = await this.prisma.profile.findUnique({ where: { userId }, include: { institution: {
      select: { id: true, name: true}
    } } });

    if (!student) {
      throw new NotFoundException(`User with this id ${userId} was not found`);
    }

    const otherProfiles = await this.prisma.profile.findMany({
      where: { NOT: { userId } },
      include: { institution: { select: { id: true, name: true } } }
    });

    const scoredProfiles = otherProfiles
      .map((profile) => {
        const interestMatch = intersection(
          student.interests,
          profile.interests,
        ).length;
        return { profile, interestMatch };
      })
      .filter((entry) => entry.interestMatch > 0)
      .sort((a, b) => b.interestMatch - a.interestMatch)
      .slice(0, 10)
      .map((entry) => entry.profile);

    return scoredProfiles;
  }

  // >>> suggest profiles based on course alone
  async suggestProfilesByCourse(userId: string) {
    const student = await this.prisma.profile.findUnique({ where: { userId }, include: { institution: {
      select: {
        id: true,
        name: true,
      }
    }} });

    if (!student) {
      throw new NotFoundException(`User with this id ${userId} was not found`);
    }

    if (!student.course) {
      return [];
    }

    const profiles = await this.prisma.profile.findMany({
      where: {
        NOT: { userId },
        course: student.course,
      },
      take: 10,
      include: { institution: { select: { id: true, name: true } } }
    });

    return profiles;
  }

  // >>> suggest profiles based on academic level alone
  async suggestProfilesByAcademicLevel(userId: string) {
    const student = await this.prisma.profile.findUnique({ where: { userId }, include: { institution: {
      select: {
        id: true,
        name: true,
      }
    }} });

    if (!student) {
      throw new NotFoundException(`User with this id ${userId} was not found`);
    }

    if (!student.academicLevel) {
      return [];
    }

    const profiles = await this.prisma.profile.findMany({
      where: {
        NOT: { userId },
        academicLevel: student.academicLevel,
      },
      take: 10,
      include: { institution: { select: { id: true, name: true } } }
    });

    return profiles;
  }

  // >>> suggest profiles based on institution alone
  async suggestProfilesByInstitution(userId: string) {
    const student = await this.prisma.profile.findUnique({ where: { userId }, include: { institution: {
      select: {
        id:true,
        name: true,
      }
    }} });

    if (!student) {
      throw new NotFoundException(`User with this id ${userId} was not found`);
    }

    if (!student.institutionId) {
      return [];
    }

    const profiles = await this.prisma.profile.findMany({
      where: {
        NOT: { userId },
        institutionId: student.institutionId,
      },
      take: 10,
      include: { institution: { select: { id: true, name: true } } }
    });

    return profiles;
  }
}