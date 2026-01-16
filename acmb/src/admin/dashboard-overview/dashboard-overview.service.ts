/* eslint-disable prettier/prettier */
 
/* eslint-disable prettier/prettier */
// institution-overview.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { InstitutionActivity } from '../../dto/institution-activity.dto';


@Injectable()
export class DashboardOverviewService {
  private prisma = new PrismaClient();
  constructor() {}

  async getOverview() {
    // Get institution map for lookup
    const institutions = await this.prisma.institution.findMany({
      select: { id: true, name: true },
    });
    const institutionMap: Record<string, string> = institutions.reduce(
      (acc, inst) => {
        acc[inst.id] = inst.name;
        return acc;
      },
      {} as Record<string, string>,
    );

    // Queries
    const [
      usersCount,
      postsCount,
      academicResourceCount,
      newSignUpsToday,
      newSignUpsLast7Days,
      newSignUpsThisMonth,
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      postsToday,
      postsLast7Days,
      likesCount,
      commentsCount,
      studentsPerInstitutionTotal,
      studentsPerInstitutionToday,
      studentsPerInstitutionLast7Days,
      studentsPerInstitutionThisMonth,
      topInstitutions,
      topPosts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.academicResource.count(),
      this.prisma.user.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(1)),
          },
        },
      }),
      this.prisma.user.count({
        where: {
          lastLogin: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      }),
      this.prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(new Date().setDate(1)),
          },
        },
      }),
      this.prisma.post.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.post.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      }),
      this.prisma.like.count(),
      this.prisma.comment.count(),
      this.prisma.profile.groupBy({
        by: ['institutionId'],
        _count: { institutionId: true },
      }),
      this.prisma.profile.groupBy({
        by: ['institutionId'],
        _count: { institutionId: true },
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.profile.groupBy({
        by: ['institutionId'],
        _count: { institutionId: true },
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      }),
      this.prisma.profile.groupBy({
        by: ['institutionId'],
        _count: { institutionId: true },
        where: {
          createdAt: { gte: new Date(new Date().setDate(1)) },
        },
      }),
      this.prisma.profile.groupBy({
        by: ['institutionId'],
        _count: { institutionId: true },
        orderBy: { _count: { institutionId: 'desc' } },
        take: 5,
      }),
      this.prisma.post.findMany({
        orderBy: { likesCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          fileUrl: true,
          likesCount: true,
          commentsCount: true,
        },
      }),
    ]);

    // Helper for formatting
    const formatInstitutionCounts = (
      arr: Array<{
        institutionId: string | null;
        _count: { institutionId: number };
      }>,
    ) => {
      return arr.reduce(
        (acc, item) => {
          const instName =
            institutionMap[item.institutionId ?? ''] || 'Unknown';
          acc[instName] = item._count.institutionId;
          return acc;
        },
        {} as Record<string, number>,
      );
    };

    return {
      usersCount,
      postsCount,
      academicResourceCount,
      newSignUpsToday,
      newSignUpsLast7Days,
      newSignUpsThisMonth,
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      postsToday,
      postsLast7Days,
      likesCount,
      commentsCount,
      studentsPerInstitution: {
        total: formatInstitutionCounts(studentsPerInstitutionTotal),
        today: formatInstitutionCounts(studentsPerInstitutionToday),
        last7Days: formatInstitutionCounts(studentsPerInstitutionLast7Days),
        thisMonth: formatInstitutionCounts(studentsPerInstitutionThisMonth),
      },
      topInstitutions: topInstitutions.map((item) => ({
        name: institutionMap[item.institutionId ?? ''] || 'Unknown',
        count: item._count.institutionId,
      })),
      topPosts,
    };
  }

  async getInstitutionActivity(): Promise<InstitutionActivity[]> {
    const institutions = await this.prisma.institution.findMany({
      select: { id: true, name: true },
    });
  
    const activity = await Promise.all(
      institutions.map(async (inst) => {
        // Count posts (via User -> Profile -> Institution)
        const totalPosts = await this.prisma.post.count({
          where: {
            author: {
              profile: {
                institutionId: inst.id,
              },
            },
          },
        });
  
        // Count resources (via Profile -> Institution)
        const totalResources = await this.prisma.academicResource.count({
          where: {
            uploader: {
              institutionId: inst.id,
            },
          },
        });
  
        return {
          institutionId: inst.id,
          institutionName: inst.name,
          totalPosts,
          totalResources,
        };
      }),
    );
  
    return activity;
  }
  


}
