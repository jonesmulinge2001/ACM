/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { NotificationEvent } from '../events/notification-event.interface';
import { NotificationRepository } from './notification.repository';
import { NotificationRealtimeService } from '../realtime/notification-realtime.service';

@Injectable()
export class NotificationStorageService {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly realtime: NotificationRealtimeService,
  ) {}

  async store(event: NotificationEvent, aggregatable: boolean) {
    let notification;

    if (!aggregatable) {
      notification = await this.repo.create(event);
    } else {
      const existing = await this.repo.findUnseenAggregatable(
        event.recipientId,
        event.type,
        event.entityId,
      );

      if (existing) {
        notification = await this.repo.aggregate(
          existing.id,
          event.actorId,
        );
      } else {
        notification = await this.repo.create(event);
      }
    }

    // 🔔 Real-time push
    this.realtime.emitToUser(event.recipientId, {
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
