/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { NotificationEvent } from '../events/notification-event.interface';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class NotificationRepository {
  constructor() {}
  private prisma = new PrismaClient()

  async findUnseenAggregatable(
    userId: string,
    type: string,
    entityId?: string,
  ) {
    return this.prisma.notification.findFirst({
      where: {
        userId,
        type,
        entityId,
        seen: false,
      },
    });
  }

  async create(event: NotificationEvent) {
    return this.prisma.notification.create({
      data: {
        userId: event.recipientId,
        type: event.type,
        entityId: event.entityId,
        actorIds: [event.actorId],
        count: 1,
      },
    });
  }

  async aggregate(notificationId: string, actorId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) return;

    const actorIds = Array.from(new Set([...notification.actorIds, actorId]));

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        actorIds,
        count: actorIds.length,
      },
    });
  }
}
