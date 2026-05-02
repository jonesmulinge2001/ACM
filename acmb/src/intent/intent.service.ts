/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable } from '@nestjs/common';
import { Intent, PrismaClient, Profile, User } from 'generated/prisma/client';
import { CreateIntentDto } from '../dto/create-intent.dto';
import { UpdateIntentDto } from '../dto/update-intent.dto';
import { NotificationEventsService } from '../notifications/events/notification-events.service';
import { NotificationEventType } from '../notifications/events/notification-event.type';

type IntentMatch = {
  intentId: string;
  matchType: 'INTENT_MATCH' | 'PROFILE_SKILL';
  intent: Intent;
  user: User & { profile: Profile | null };
};
@Injectable()
export class IntentService {
  constructor(private readonly notificationEvents: NotificationEventsService) {}

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
    /**
     * 1. INTENT ↔ INTENT MATCHING
     */
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

    const matchedIntentUserIds = similarUsers.map((u) => u.userId);

    /**
     * 2. INTENT ↔ PROFILE SKILL MATCHING
     */
    const profileMatches = intent.context?.skill
      ? await this.prisma.profile.findMany({
          where: {
            userId: {
              not: userId,
              notIn: matchedIntentUserIds,
            },
            skills: {
              has: intent.context.skill,
            },
          },
          take: 5,
        })
      : [];

    /**
     * 3. EXISTING INTENT MATCH NOTIFICATIONS
     */
    for (const match of similarUsers) {
      const matchedUserId = match.userId;

      // A → B
      this.notificationEvents.emit({
        type: NotificationEventType.INTENT_OVERLAP,
        actorId: matchedUserId,
        recipientId: userId,
        entityId: intent.type,
        metadata: {
          intentType: intent.type,
          skill: intent.context?.skill || null,
          source: 'INTENT_MATCH',
        },
        createdAt: new Date(),
      });

      // B → A
      const existingForMatchedUser = await this.prisma.notification.findFirst({
        where: {
          userId: matchedUserId,
          type: 'INTENT_OVERLAP',
          entityId: intent.type,
          seen: false,
        },
      });

      if (!existingForMatchedUser) {
        this.notificationEvents.emit({
          type: NotificationEventType.INTENT_OVERLAP,
          actorId: userId,
          recipientId: matchedUserId,
          entityId: intent.type,
          metadata: {
            intentType: intent.type,
            skill: intent.context?.skill || null,
            source: 'INTENT_MATCH',
          },
          createdAt: new Date(),
        });
      }
    }

    /**
     * 4. PROFILE SKILL MATCH NOTIFICATIONS
     */
    for (const profile of profileMatches) {
      const existingNotification = await this.prisma.notification.findFirst({
        where: {
          userId: profile.userId,
          type: 'INTENT_OVERLAP',
          entityId: intent.type,
          seen: false,
        },
      });

      if (!existingNotification) {
        this.notificationEvents.emit({
          type: NotificationEventType.INTENT_OVERLAP,
          actorId: userId,
          recipientId: profile.userId,
          entityId: intent.type,
          metadata: {
            intentType: intent.type,
            skill: intent.context?.skill || null,
            source: 'PROFILE_SKILL',
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

  async findMatches(userId: string): Promise<IntentMatch[]> {
    const myIntents = await this.prisma.intent.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (!myIntents.length) return [];

    const matches: IntentMatch[] = [];

    for (const intent of myIntents) {
      const skill = intent.context?.['skill'] as string | undefined;

      const intentMatches = await this.prisma.intent.findMany({
        where: {
          userId: { not: userId },
          isActive: true,
          type: intent.type,

          ...(skill && {
            OR: [
              {
                context: {
                  path: ['skill'],
                  equals: skill,
                },
              },
              {
                user: {
                  profile: {
                    skills: {
                      has: skill,
                    },
                  },
                },
              },
            ],
          }),
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
        take: 20,
      });

      for (const match of intentMatches) {
        const skillMatch = (match.context as any)?.skill === skill;

        matches.push({
          intentId: intent.id,
          matchType: skillMatch ? 'INTENT_MATCH' : 'PROFILE_SKILL',
          intent,
          user: match.user,
        });
      }
    }

    return matches;
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
