/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { MailerService } from 'src/shared/mailer/mailer.service';

@Injectable()
export class UserManagementService {
  private prisma = new PrismaClient();

  constructor(private readonly mailerService: MailerService) {}

  // Get all users (with stats)
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profile: {
          select: {
            profileImage: true,
            institution: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        posts: { select: { id: true } },
        followers: { select: { id: true } },
      },
    });

    return users.map((user) => ({
      ...user,
      totalPosts: user.posts.length,
      totalFollowers: user.followers.length,
    }));
  }

  // Get user by ID
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profile: {
          select: {
            profileImage: true,
            institution: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        posts: { select: { id: true } },
        followers: { select: { id: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
      totalPosts: user.posts.length,
      totalFollowers: user.followers.length,
    };
  }

  //  Update user (safe)
  async updateUser(id: string, updateData: Partial<any>) {
    const userExists = await this.prisma.user.findUnique({ where: { id } });
    if (!userExists) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profile: {
          select: {
            profileImage: true,
            institution: {
              select: {
                id: true,
                 name: true,},
            },
          },
        },
      },
    });
  }

  //  Delete user
  async deleteUser(id: string) {
    const userExists = await this.prisma.user.findUnique({ where: { id } });
    if (!userExists) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }

  //  Suspend user (with reason + log)
  async suspendUser(id: string, adminId: string, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profile: {
          select: {
            profileImage: true,
            institution: { select: { id: true, name: true, logoUrl: true } },
          },
        },
      },
    });

    // Log suspension
    await this.prisma.userSuspension.create({
      data: { userId: id, adminId, reason },
    });

    // Notify user
    await this.mailerService.sendEmail({
      to: updatedUser.email,
      subject: 'Your Academeet account has been suspended',
      template: 'email/suspend',
      context: {
        username: updatedUser.name,
        supportEmail: 'support@academeet.com',
        reason,
      },
    });

    return updatedUser;
  }

  //  Restore user (log restore)
  async restoreUser(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.status !== 'SUSPENDED') {
      throw new Error('User is not suspended');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profile: {
          select: {
            profileImage: true,
            institution: { select: { id: true, name: true, logoUrl: true } },
          },
        },
      },
    });

    await this.prisma.userSuspension.updateMany({
      where: { userId: id, restoredAt: null },
      data: { restoredAt: new Date(), restoredBy: adminId },
    });

    await this.mailerService.sendEmail({
      to: updatedUser.email,
      subject: 'Your Academeet account has been restored',
      template: 'email/restore',
      context: {
        username: updatedUser.name,
        supportEmail: 'support@academeet.com',
        loginUrl: 'http://localhost:4200/auth/login',
      },
    });

    return updatedUser;
  }

  //  Mass suspend
  async suspendUsers(ids: string[], adminId: string, reason: string) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true, name: true },
    });

    await this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { status: 'SUSPENDED' },
    });

    for (const user of users) {
      await this.prisma.userSuspension.create({
        data: { userId: user.id, adminId, reason },
      });

      await this.mailerService.sendEmail({
        to: user.email,
        subject: 'Your Academeet account has been suspended',
        template: 'email/suspend',
        context: {
          username: user.name,
          supportEmail: 'support@academeet.com',
          reason,
        },
      });
    }

    return { message: `${ids.length} users suspended successfully` };
  }

  //  Mass restore
  async restoreUsers(ids: string[], adminId: string) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids }, status: 'SUSPENDED' },
      select: { id: true, email: true, name: true },
    });

    await this.prisma.user.updateMany({
      where: { id: { in: ids }, status: 'SUSPENDED' },
      data: { status: 'ACTIVE' },
    });

    for (const user of users) {
      await this.prisma.userSuspension.updateMany({
        where: { userId: user.id, restoredAt: null },
        data: { restoredAt: new Date(), restoredBy: adminId },
      });

      await this.mailerService.sendEmail({
        to: user.email,
        subject: 'Your Academeet account has been restored',
        template: 'email/restore',
        context: {
          username: user.name,
          supportEmail: 'support@academeet.com',
          loginUrl: 'http://localhost:4200/auth/login',
        },
      });
    }

    return { message: `${ids.length} users restored successfully` };
  }

  async deleteUsers(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No user IDs provided');
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (users.length === 0) {
      throw new NotFoundException('No users found with the given IDs');
    }

    await this.prisma.user.deleteMany({
      where: { id: { in: ids } },
    });

    return { message: `${users.length} user(s) deleted successfully` };
  }
}
