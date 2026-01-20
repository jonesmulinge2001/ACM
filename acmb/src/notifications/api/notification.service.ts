/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class NotificationService {
  constructor() {}
  private prisma = new PrismaClient();

  async getNotifications(userId: string, cursor?: string, limit = 20) {
    const MAX_NAMES_DISPLAY = 2;
  
    // 1️⃣ Fetch notifications
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: cursor ? 1 : 0,
      ...(cursor && { cursor: { id: cursor } }),
    });
  
    if (notifications.length === 0) return [];
  
    // 2️⃣ Fetch all actors' info in one query
    const allActorIds = notifications.flatMap(n => n.actorIds);
    const uniqueActorIds = Array.from(new Set(allActorIds));
  
    const actors = await this.prisma.user.findMany({
      where: { id: { in: uniqueActorIds } },
      select: { id: true, name: true },
    });
  
    const actorMap = new Map(actors.map(a => [a.id, a.name]));
  
    // 3️⃣ Map notifications for friendly display
    const mapped = notifications.map(n => {
      const actorNames = n.actorIds.map(id => actorMap.get(id) || 'Unknown');
  
      let message = '';
      switch (n.type) {
        case 'POST_LIKED':
        case 'POST_COMMENTED':
          if (actorNames.length <= MAX_NAMES_DISPLAY) {
            message =
              n.count > 1
                ? `${actorNames.join(', ')} ${n.type === 'POST_LIKED' ? 'liked' : 'commented on'} your post`
                : `${actorNames[0]} ${n.type === 'POST_LIKED' ? 'liked' : 'commented on'} your post`;
          } else {
            const displayed = actorNames.slice(0, MAX_NAMES_DISPLAY).join(', ');
            const others = n.count - MAX_NAMES_DISPLAY;
            message = `${displayed}, +${others} others ${n.type === 'POST_LIKED' ? 'liked' : 'commented on'} your post`;
          }
          break;
  
        case 'FOLLOWED':
          if (actorNames.length <= MAX_NAMES_DISPLAY) {
            message = `${actorNames.join(', ')} started following you`;
          } else {
            const displayed = actorNames.slice(0, MAX_NAMES_DISPLAY).join(', ');
            const others = n.count - MAX_NAMES_DISPLAY;
            message = `${displayed}, +${others} others started following you`;
          }
          break;
  
        case 'MESSAGE_SENT':
          if (actorNames.length <= MAX_NAMES_DISPLAY) {
            message = `You have a new message from ${actorNames.join(', ')}`;
          } else {
            const displayed = actorNames.slice(0, MAX_NAMES_DISPLAY).join(', ');
            const others = n.count - MAX_NAMES_DISPLAY;
            message = `You have new messages from ${displayed}, +${others} others`;
          }
          break;
  
        default:
          message = 'You have a new notification';
      }
  
      return {
        id: n.id,
        type: n.type,
        entityId: n.entityId,
        actorIds: n.actorIds,
        actorNames, // include names for frontend
        count: n.count,
        seen: n.seen,
        createdAt: n.createdAt,
        message, // friendly aggregated message
      };
    });
  
    return mapped;
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
