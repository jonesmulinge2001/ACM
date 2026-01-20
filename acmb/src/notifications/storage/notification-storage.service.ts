/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { NotificationEvent } from '../events/notification-event.interface';
import { NotificationRealtimeService } from '../realtime/notification-realtime.service';
import { PrismaClient } from 'generated/prisma/client';


@Injectable()
export class NotificationStorageService {
  private prisma = new PrismaClient();

  constructor(private readonly realtime: NotificationRealtimeService) {}

  async store(event: NotificationEvent, aggregatable: boolean) {
    console.log('STORE CALLED', event, aggregatable); // debug
    let notification;

    if (!aggregatable) {
      // Non-aggregatable: create directly
      notification = await this.prisma.notification.create({
        data: {
          userId: event.recipientId,
          actorIds: [event.actorId],
          type: event.type,
          entityId: event.entityId,
          count: 1,
          seen: false,
          createdAt: event.createdAt,
        },
      });
    } else {
      // Aggregatable (likes, comments)
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: event.recipientId,
          type: event.type,
          entityId: event.entityId,
          seen: false,
        },
      });

      if (existing) {
        notification = await this.prisma.notification.update({
          where: { id: existing.id },
          data: {
            actorIds: { push: event.actorId },
            count: { increment: 1 },
          },
        });
      } else {
        notification = await this.prisma.notification.create({
          data: {
            userId: event.recipientId,
            actorIds: [event.actorId],
            type: event.type,
            entityId: event.entityId,
            count: 1,
            seen: false,
            createdAt: event.createdAt,
          },
        });
      }
    }

    // Real-time push
    await this.realtime.emitToUser(event.recipientId, {
      id: notification.id,
      type: notification.type,
      entityId: notification.entityId,
      count: notification.count,
      actorIds: notification.actorIds,
      createdAt: notification.createdAt,
    });

    return notification;
  }
}
