/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class StudentNotificationsService {
  private prisma = new PrismaClient();

  /** Fetch all notifications for a student */
  async getNotifications(studentId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Fetch only unread notifications */
  async getUnreadNotifications(studentId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: studentId, readAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Mark a notification as read */
  async markNotificationAsRead(notificationId: string, studentId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.recipientId !== studentId)
      throw new ForbiddenException('Not authorized');

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  /** Fetch all announcements for the student's institution */
  async getInstitutionAnnouncements(studentId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: studentId },
      select: { institutionId: true },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.institutionAnnouncement.findMany({
      where: { institutionId: profile.institutionId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
