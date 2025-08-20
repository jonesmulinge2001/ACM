/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class DashboardOverviewService {
  private prisma = new PrismaClient();

  async getOverView() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
  
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
      // ====== PARALLEL QUERIES WITH DEBUGGING ======
      const queries = [
        this.prisma.user.count(), // 0
        this.prisma.post.count(), // 1
        this.prisma.academicResource.count(), // 2
        this.prisma.user.count({ where: { createdAt: { gte: today } } }), // 3
        this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }), // 4
        this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }), // 5
  
        this.prisma.user.count({ where: { lastLogin: { gte: today } } }), // 6
        this.prisma.user.count({ where: { lastLogin: { gte: sevenDaysAgo } } }), // 7
        this.prisma.user.count({ where: { lastLogin: { gte: startOfMonth } } }), // 8
  
        this.prisma.post.count({ where: { createdAt: { gte: today } } }), // 9
        this.prisma.post.count({ where: { createdAt: { gte: sevenDaysAgo } } }), // 10
  
        this.prisma.like.count(), // 11
        this.prisma.comment.count(), // 12
  
        this.prisma.profile.groupBy({
          by: ['institution'],
          _count: { institution: true },
        }), // 13
        this.prisma.profile.groupBy({
          by: ['institution'],
          where: { createdAt: { gte: today } },
          _count: { institution: true },
        }), // 14
        this.prisma.profile.groupBy({
          by: ['institution'],
          where: { createdAt: { gte: sevenDaysAgo } },
          _count: { institution: true },
        }), // 15
        this.prisma.profile.groupBy({
          by: ['institution'],
          where: { createdAt: { gte: startOfMonth } },
          _count: { institution: true },
        }), // 16
  
        this.prisma.profile.groupBy({
          by: ['institution'],
          _count: { institution: true },
          orderBy: { _count: { institution: 'desc' } },
          take: 5,
        }), // 17
  
        this.prisma.post.findMany({
          take: 5,
          orderBy: [
            { likes: { _count: 'desc' } },
            { comments: { _count: 'desc' } }
          ],
          include: {
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        })
        
      ];
  
      const results = await Promise.allSettled(queries);
  
      results.forEach((res, idx) => {
        if (res.status === 'rejected') {
          console.error(`❌ Query ${idx} failed:`, res.reason);
        } else {
          console.log(`✅ Query ${idx} success`);
        }
      });
  
      // If any query failed, throw an error immediately
      const hasError = results.some((r) => r.status === 'rejected');
      if (hasError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'One or more queries failed – check logs above ⬆️',
            failedQueries: results
              .map((r, idx) => (r.status === 'rejected' ? idx : null))
              .filter((i) => i !== null),
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
  
      // Extract values safely
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
      ] = results.map((r: any) => r.value);
  
      // ====== Same formatting logic as before ======
      const formatInstitutionCounts = (arr: any[], allInstitutions: string[]) => {
        const counts = arr.reduce((acc, item) => {
          acc[item.institution] = item._count.institution;
          return acc;
        }, {} as Record<string, number>);
  
        allInstitutions.forEach((inst) => {
          if (!(inst in counts)) counts[inst] = 0;
        });
  
        return counts;
      };
  
      const allInstitutions = studentsPerInstitutionTotal.map(
        (item) => item.institution,
      );
  
      return {
        statusCode: HttpStatus.OK,
        message: 'Overview fetched successfully',
        data: {
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
            total: formatInstitutionCounts(studentsPerInstitutionTotal, allInstitutions),
            today: formatInstitutionCounts(studentsPerInstitutionToday, allInstitutions),
            last7Days: formatInstitutionCounts(studentsPerInstitutionLast7Days, allInstitutions),
            thisMonth: formatInstitutionCounts(studentsPerInstitutionThisMonth, allInstitutions),
          },
          topInstitutions: topInstitutions.map((t) => ({
            institution: t.institution,
            activeUsers: t._count.institution,
          })),
          topPosts: topPosts.map((p) => ({
            id: p.id,
            title: p.title,
            fileUrl: p.fileUrl,
            likesCount: p._count.likes,
            commentsCount: p._count.comments,
          })),
          
          
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch overview',
          error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
}
