/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
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
    
          const [
            usersCount,
            postsCount,
            academicResourceCount,
            newSignUpsToday,
            newSignUpsLast7Days,
            newSignUpsThisMonth,
            studentsPerInstitutionTotal,
            studentsPerInstitutionToday,
            studentsPerInstitutionLast7Days,
            studentsPerInstitutionThisMonth,
          ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.post.count(),
            this.prisma.academicResource.count(),
            this.prisma.user.count({ where: { createdAt: { gte: today } } }),
            this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
            this.prisma.profile.groupBy({ by: ['institution'], _count: { institution: true } }),
            this.prisma.profile.groupBy({ by: ['institution'], where: { createdAt: { gte: today } }, _count: { institution: true } }),
            this.prisma.profile.groupBy({ by: ['institution'], where: { createdAt: { gte: sevenDaysAgo } }, _count: { institution: true } }),
            this.prisma.profile.groupBy({ by: ['institution'], where: { createdAt: { gte: startOfMonth } }, _count: { institution: true } }),
          ]);
    
          // Helper to format groupBy results and ensure all institutions are included
          const formatInstitutionCounts = (arr: any[], allInstitutions: string[]) => {
            const counts = arr.reduce((acc, item) => {
              acc[item.institution] = item._count.institution;
              return acc;
            }, {} as Record<string, number>);
    
            allInstitutions.forEach(inst => {
              if (!(inst in counts)) counts[inst] = 0;
            });
    
            return counts;
          };
    
          const allInstitutions = studentsPerInstitutionTotal.map(item => item.institution);
    
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
              studentsPerInstitution: {
                total: formatInstitutionCounts(studentsPerInstitutionTotal, allInstitutions),
                today: formatInstitutionCounts(studentsPerInstitutionToday, allInstitutions),
                last7Days: formatInstitutionCounts(studentsPerInstitutionLast7Days, allInstitutions),
                thisMonth: formatInstitutionCounts(studentsPerInstitutionThisMonth, allInstitutions),
              },
            },
          };
        } catch (error) {
          throw new HttpException(
            { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to fetch overview', error },
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
      }
}
