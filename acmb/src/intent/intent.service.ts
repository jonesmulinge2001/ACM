/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */

import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';
import { CreateIntentDto } from 'src/dto/create-intent.dto';
import { UpdateIntentDto } from 'src/dto/update-intent.dto';
import { NotificationEventsService } from 'src/notifications/events/notification-events.service';
import { NotificationEventType } from '../notifications/events/notification-event.type';

@Injectable()
export class IntentService {
  constructor(
    private readonly notificationEvents: NotificationEventsService,
  ) {}

  private prisma = new PrismaClient();

  async create(userId: string, dto: CreateIntentDto) {
    const intent = await this.prisma.intent.create({
      data: {
        userId,
        type: dto.type,
        priority: dto.priority,
        context: dto.context,
      },
    });

    await this.handleIntentMatching(userId, intent);

    return intent;
  }

  private async handleIntentMatching(userId: string, intent: any) {
    const similarUsers = await this.prisma.intent.findMany({
      where: {
        type: intent.type,
        userId: { not: userId },
        isActive: true,

        ...(intent.context?.skill && {
          context: {
            path: ['skill'],
            equals: intent.context.skill,
          },
        }),
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
      take: 5,
    });

    if (!similarUsers.length) return;

    for (const match of similarUsers) {
      const matchedUserId = match.userId;

      // =========================
      // A → B (current user sees match)
      // =========================
      this.notificationEvents.emit({
        type: NotificationEventType.INTENT_OVERLAP,
        actorId: matchedUserId,
        recipientId: userId,
        entityId: intent.type,
        metadata: {
          intentType: intent.type,
          skill: intent.context?.skill || null,
        },
        createdAt: new Date(),
      });

      // =========================
      // B → A (matched user sees current user)
      // =========================

      const existingForMatchedUser =
        await this.prisma.notification.findFirst({
          where: {
            userId: matchedUserId,
            type: 'INTENT_OVERLAP',
            entityId: intent.type,
            seen: false,
          },
        });

      // prevent spam duplication on matched side
      if (!existingForMatchedUser) {
        this.notificationEvents.emit({
          type: NotificationEventType.INTENT_OVERLAP,
          actorId: userId,
          recipientId: matchedUserId,
          entityId: intent.type,
          metadata: {
            intentType: intent.type,
            skill: intent.context?.skill || null,
          },
          createdAt: new Date(),
        });
      }
    }
  }

  async findMine(userId: string) {
    return this.prisma.intent.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(intentId: string, dto: UpdateIntentDto) {
    return this.prisma.intent.update({
      where: { id: intentId },
      data: dto,
    });
  }

  async deactivate(intentId: string) {
    return this.prisma.intent.update({
      where: { id: intentId },
      data: { isActive: false },
    });
  }
}