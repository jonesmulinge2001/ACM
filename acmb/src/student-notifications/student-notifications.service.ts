/* eslint-disable prettier/prettier */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { NotificationsGateway } from './notifications.gateway';
import { StudentNotificationDto } from 'src/dto/student-notification';

@Injectable()
export class StudentNotificationsService {
  private prisma = new PrismaClient();

  constructor(private readonly notificationsGateway: NotificationsGateway) {}

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

  /** Create a notification and push it via WebSocket */
  async createNotification(
    studentId: string,
    data: Omit<StudentNotificationDto, 'id' | 'createdAt' | 'readAt'>,
  ) {
    const newNotification = await this.prisma.notification.create({
      data: {
        recipientId: studentId,
        type: data.type,
        referenceId: data.referenceId,
        message: data.message,
      },
    });

    // ✅ Push to client in real-time
    this.notificationsGateway.sendToStudent(studentId, newNotification);

    return newNotification;
  }

  /** Fetch announcements for the student's institution */
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
