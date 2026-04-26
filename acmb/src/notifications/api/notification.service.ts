/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';

type IntentOverlapMetadata = {
  intentType?: string;
  skill?: string | null;
};

@Injectable()
export class NotificationService {
  constructor() {}
  private prisma = new PrismaClient();

  async getNotifications(userId: string, cursor?: string, limit = 20) {
    const MAX_NAMES_DISPLAY = 2;
    

    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: cursor ? 1 : 0,
      ...(cursor && { cursor: { id: cursor } }),
    });

    // RETURN PROPER SHAPE (NOT ARRAY)
    if (notifications.length === 0) {
      return {
        notifications: [],
        unreadCount: 0,
      };
    }

    // GROUPING
    const groupedMap = new Map<string, any>();

    for (const n of notifications) {
      const key = `${n.type}:${n.entityId ?? 'null'}`;

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          ...n,
          actorIds: [...n.actorIds],
        });
      } else {
        const existing = groupedMap.get(key);

        groupedMap.set(key, {
          ...existing,
          actorIds: Array.from(new Set([...existing.actorIds, ...n.actorIds])),
          count: existing.count + n.count,
          createdAt:
            existing.createdAt > n.createdAt ? existing.createdAt : n.createdAt,
        });
      }
    }

    const groupedNotifications = Array.from(groupedMap.values());

    // FETCH ACTORS
    const allActorIds = groupedNotifications.flatMap((n) => n.actorIds);
    const uniqueActorIds = Array.from(new Set(allActorIds));

    const actors = await this.prisma.user.findMany({
      where: { id: { in: uniqueActorIds } },
      select: { id: true, name: true },
    });

    const actorMap = new Map(actors.map((a) => [a.id, a.name]));

    const actorProfiles = await this.prisma.profile.findMany({
      where: { userId: { in: uniqueActorIds } },
      select: {
        id: true,
        userId: true,
        name: true,
        profileImage: true,
        institutionId: true,
        course: true,
      },
    });

    const profileMap = new Map(actorProfiles.map((p) => [p.userId, p]));

    // 🔥 FORMAT RESPONSE
    
    const formatted = groupedNotifications.map((n) => {
      const extraCount = Math.max(0, n.count - MAX_NAMES_DISPLAY);
      const actorNames = n.actorIds.map((id) => actorMap.get(id) || 'Unknown');

      const actorProfilesData = n.actorIds
        .map((id) => profileMap.get(id))
        .filter(Boolean);

      let message = '';

      switch (n.type) {
        case 'POST_LIKED': {
          message =
            n.count > 1
              ? `${actorNames.slice(0, MAX_NAMES_DISPLAY).join(', ')} +${
                extraCount
                } others liked your post ❤️`
              : `${actorNames[0]} liked your post ❤️`;
          break;
        }

        case 'POST_COMMENTED': {
          message =
            n.count > 1
              ? `${actorNames.slice(0, MAX_NAMES_DISPLAY).join(', ')} +${
                extraCount
                } others commented on your post`
              : `${actorNames[0]} commented on your post`;
          break;
        }

        case 'FOLLOWED':
          message =
            n.count > 1
              ? `${actorNames.slice(0, MAX_NAMES_DISPLAY).join(', ')} +${
                extraCount
                } others started following you`
              : `${actorNames[0]} started following you`;
          break;

        case 'MESSAGE_SENT':
          message =
            n.count > 1
              ? `You have messages from ${actorNames
                  .slice(0, MAX_NAMES_DISPLAY)
                  .join(', ')} +${extraCount} others`
              : `You have a message from ${actorNames[0]}`;
          break;

        case 'INTENT_OVERLAP': {
          const metadata = n.metadata as any;
          const intentType = metadata?.intentType || 'similar opportunities';

          message =
            n.count > 1
              ? `${actorNames.slice(0, MAX_NAMES_DISPLAY).join(', ')} +${
                extraCount
                } others are looking for ${intentType}`
              : `${actorNames[0]} is looking for ${intentType}`;
          break;
        }

        case 'PROFILE_VIEWED':
          message =
            n.count > 1
              ? `${actorNames.slice(0, MAX_NAMES_DISPLAY).join(', ')} +${
                extraCount
                } others viewed your profile`
              : `${actorNames[0]} viewed your profile`;
          break;

        default:
          message = 'You have a new notification';
      }

      const action = this.resolveNotificationAction(
        n.type,
        n.entityId,
        n.actorIds,
      );

      return {
        id: n.id,
        type: n.type,
        entityId: n.entityId,

        actorIds: n.actorIds,
        actorNames,
        actorProfiles: actorProfilesData,

        count: n.count,
        seen: n.seen,
        createdAt: n.createdAt,

        message,

        actionUrl: action.actionUrl,
        actionMeta: action.actionMeta,
      };
    });

    // ✅ ADD UNREAD COUNT
    const unreadCount = await this.getUnreadCount(userId);

    // ✅ FINAL RESPONSE
    return {
      notifications: formatted,
      unreadCount,
    };
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

  private resolveNotificationAction(
    type: string,
    entityId: string | null,
    actorIds: string[],
  ) {
    switch (type) {
      case 'POST_LIKED':
      case 'POST_COMMENTED':
        return {
          actionUrl: `/posts/${entityId}`,
          actionMeta: {
            postId: entityId,
          },
        };

      case 'MESSAGE_SENT':
        return {
          actionUrl: `/conversations/${actorIds[0]}`,
          actionMeta: {
            chatWithUserId: actorIds[0],
          },
        };

      case 'FOLLOWED':
        return {
          actionUrl: `/profile/${actorIds[0]}`,
          actionMeta: {
            userId: actorIds[0],
          },
        };

      default:
        return {
          actionUrl: `/notifications`,
          actionMeta: null,
        };
    }
  }
}
