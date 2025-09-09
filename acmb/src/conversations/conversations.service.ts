/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class ConversationsService {
  private prisma = new PrismaClient();

  // Create or return existing one-on-one conversation
  async createOneOnOne(currentUserId: string, otherUserId: string) {
    if (currentUserId === otherUserId)
      throw new BadRequestException(
        'Cannot create a conversation with yourself',
      );

    // deterministic key
    const ids = [currentUserId, otherUserId].sort();
    const key = `${ids[0]}:${ids[1]}`;

    const existing = await this.prisma.conversation.findUnique({
      where: { oneOnOneKey: key },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, profile: true } },
          },
        },
      },
    });
    if (existing) return existing;

    // create conversation + participants
    const conv = await this.prisma.conversation.create({
      data: {
        isGroup: false,
        oneOnOneKey: key,
        participants: {
          createMany: {
            data: [{ userId: ids[0] }, { userId: ids[1] }],
          },
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, profile: true } },
          },
        },
      },
    });

    return conv;
  }

  // ensures user is participant
  private async ensureParticipant(conversationId: string, userId: string) {
    const p = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } as any }, // generated prisma composite name maybe different
    });
    if (!p) throw new ForbiddenException('Not a conversation participant');
    return p;
  }

  // Send message (used by controller or gateway)
  async sendMessage(
    senderId: string,
    dto: {
      conversationId?: string;
      recipientId?: string;
      content?: string;
      attachments?: any;
    },
  ) {
    let conversationId = dto.conversationId;

    // If recipientId provided and conversationId not, create or reuse a one-on-one
    if (!conversationId && dto.recipientId) {
      const ids = [senderId, dto.recipientId].sort();
      const key = `${ids[0]}:${ids[1]}`;
      let conv = await this.prisma.conversation.findUnique({
        where: { oneOnOneKey: key },
      });
      if (!conv) {
        conv = await this.prisma.conversation.create({
          data: {
            isGroup: false,
            oneOnOneKey: key,
            participants: {
              createMany: {
                data: [{ userId: ids[0] }, { userId: ids[1] }],
              },
            },
          },
        });
      }
      conversationId = conv.id;
    }

    if (!conversationId)
      throw new BadRequestException('conversationId or recipientId required');

    // ensure sender is a participant
    await this.ensureParticipant(conversationId, senderId);

    const saved = await this.prisma.conversationMessage.create({
      data: {
        conversationId,
        senderId,
        content: dto.content ?? '',
        attachments: dto.attachments ?? null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: { select: { profileImage: true } },
          },
        },
      },
    });

    // optional: update conversation.updatedAt is automatic with @updatedAt

    // flatten sender.profileImage like other parts of your app
    const message = {
      id: saved.id,
      conversationId: saved.conversationId,
      content: saved.content,
      attachments: saved.attachments,
      createdAt: saved.createdAt,
      sender: {
        id: saved.sender.id,
        name: saved.sender.name,
        profileImage: saved.sender.profile?.profileImage ?? null,
      },
      senderId: saved.senderId,
    };

    return message;
  }

  // Get messages with pagination (cursor = message id)
  async getMessages(conversationId: string, limit = 50, cursor?: string) {
    // check participant? optionally check in controller/gateway
    const messages = await this.prisma.conversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: { select: { profileImage: true } },
          },
        },
      },
    });

    // flatten sender.profileImage
    return messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      content: m.content,
      attachments: m.attachments,
      createdAt: m.createdAt,
      senderId: m.senderId,
      sender: {
        id: m.sender.id,
        name: m.sender.name,
        profileImage: m.sender.profile?.profileImage ?? null,
      },
    }));
  }

  // list conversations for user with last message preview & unread count
  async listConversationsForUser(userId: string) {
    // first load participant rows + conversation basic info
    const parts = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, profile: true } },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    profile: { select: { profileImage: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // compute unread counts
    const result = await Promise.all(
      parts.map(async (p) => {
        const lastRead = p.lastReadAt ?? new Date(0);
        const unread = await this.prisma.conversationMessage.count({
          where: {
            conversationId: p.conversationId,
            createdAt: { gt: lastRead },
            senderId: { not: userId },
          },
        });

        const lastMessage = p.conversation.messages?.[0] ?? null;

        return {
          conversationId: p.conversationId,
          isGroup: p.conversation.isGroup,
          title: p.conversation.title,
          participants: p.conversation.participants.map((pp) => ({
            id: pp.user.id,
            name: pp.user.name,
            profileImage: pp.user.profile?.profileImage ?? null,
          })),
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                sender: lastMessage.sender
                  ? {
                      id: lastMessage.sender.id,
                      name: lastMessage.sender.name,
                      profileImage:
                        lastMessage.sender.profile?.profileImage ?? null,
                    }
                  : null,
              }
            : null,
          unreadCount: unread,
        };
      }),
    );

    return result;
  }

  // Mark as read: update participant.lastReadAt
  async markAsRead(conversationId: string, userId: string, at?: Date) {
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: at ?? new Date() },
    });
    return { success: true };
  }
}
