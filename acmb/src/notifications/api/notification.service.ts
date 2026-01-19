/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor() {}
  private prisma = new PrismaClient();

  async getNotifications(userId: string, cursor?: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: cursor ? 1 : 0,
      ...(cursor && {
        cursor: { id: cursor },
      }),
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        seen: false,
      },
    });
  }

  async markAsSeen(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        seen: true,
      },
    });
  }

  async markAllAsSeen(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        seen: false,
      },
      data: {
        seen: true,
      },
    });
  }
}
