/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '../../generated/prisma/client';
import { MessageAttachment } from '../dto/message-attachment.dto';
import { AcademeetCloudinaryService } from '../shared/cloudinary/cloudinary/cloudinary.service';
import { NotificationEventsService } from '../notifications/events/notification-events.service';
import { NotificationEventType } from '../notifications/events/notification-event.type';
import { NotificationEvent } from '../notifications/events/notification-event.interface';
import { GetRecentConversationsDto } from 'src/dto/GetRecentConversationsDto';

@Injectable()
export class ConversationsService {
  constructor(
    private cloudinaryService: AcademeetCloudinaryService,
    private readonly notificationEvents: NotificationEventsService,
  ) {}
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
      attachments?: MessageAttachment[] | null;
    },
  ) {
    let conversationId = dto.conversationId;

    // 1. Resolve Conversation (Auto-create if 1-on-1)
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

    if (!conversationId) {
      throw new BadRequestException('conversationId or recipientId required');
    }

    // 2. Security check
    await this.ensureParticipant(conversationId, senderId);

    // 3. Normalize attachments for Prisma JSON
    const attachments =
      dto.attachments && dto.attachments.length > 0
        ? (dto.attachments as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;

    // 4. Create message
    const saved = await this.prisma.conversationMessage.create({
      data: {
        conversationId,
        senderId,
        content: dto.content ?? '',
        attachments,
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

// fetch participants
const participants = await this.prisma.conversationParticipant.findMany({
  where: { conversationId },
  select: { userId: true },
});

const recipients = participants
  .map(p => p.userId)
  .filter(id => id !== senderId);

for (const recipientId of recipients) {
  const event: NotificationEvent = {
    type: NotificationEventType.MESSAGE_SENT,
    actorId: senderId,
    recipientId,
    entityId: saved.id,
    createdAt: new Date(),
  };

  console.log('MESSAGE EVENT EMITTED', event); // 🔥 should see this now
  this.notificationEvents.emit(event);
}

    // 5. Flatten response
    return {
      id: saved.id,
      conversationId: saved.conversationId,
      content: saved.content,
      attachments: saved.attachments,
      createdAt: saved.createdAt,
      senderId: saved.senderId,
      sender: {
        id: saved.sender.id,
        name: saved.sender.name,
        profileImage: saved.sender.profile?.profileImage ?? null,
      },
    };
  }

  async editMessage(senderId: string, messageId: string, newContent: string) {
    // 1. find the message
    const message = await this.prisma.conversationMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // 2. ensure the user is the sender
    if (message.senderId !== senderId) {
      throw new ForbiddenException('You can only edit your own message');
    }

    // 3. prevent editing deleted messages
    if ((message as any).isDeleted) {
      throw new BadRequestException('Cannot edit a deleted message');
    }

    // 4. Update message
    return this.prisma.conversationMessage.update({
      where: { id: messageId },
      data: {
        content: newContent,
      },
    });
  }

  // Delete Message
  async deleteMessage(senderId: string, messageId: string) {
    const message = await this.prisma.conversationMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }
    if (message.senderId !== senderId) {
      throw new ForbiddenException('You can only delete your own message');
    }
    return this.prisma.conversationMessage.update({
      where: { id: messageId },
      data: {
        content: '[message deleted]',
      },
    });
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

  // Get full conversation with participants
  async getConversation(conversationId: string, userId: string) {
    // Ensure user is a participant
    await this.ensureParticipant(conversationId, userId);

    const convo = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profile: { select: { profileImage: true } },
              },
            },
          },
        },
      },
    });

    if (!convo) throw new BadRequestException('Conversation not found');

    return {
      id: convo.id,
      isGroup: convo.isGroup,
      title: convo.title,
      participants: convo.participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        profileImage: p.user.profile?.profileImage ?? null,
      })),
    };
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

  
  async getRecentConversations(userId: string, dto: GetRecentConversationsDto) {
    const participants =
      await this.prisma.conversationParticipant.findMany({
        where: { userId },
        include: {
          conversation: {
            include: {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      profile: {
                        select: { profileImage: true },
                      },
                    },
                  },
                },
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          conversation: { updatedAt: 'desc' },
        },
        take: dto.limit,
      });
  
    return Promise.all(
      participants.map(async (cp) => {
        const convo = cp.conversation;
        const lastMessage = convo.messages[0] ?? null;
  
        const unreadCount = await this.prisma.conversationMessage.count({
          where: {
            conversationId: convo.id,
            senderId: { not: userId },
            createdAt: {
              gt: cp.lastReadAt ?? new Date(0),
            },
          },
        });
  
        return {
          conversationId: convo.id,
          isGroup: convo.isGroup,
          title: convo.title,
          participants: convo.participants
            .filter((p) => p.userId !== userId)
            .map((p) => ({
              id: p.user.id,
              name: p.user.name,
              profileImage: p.user.profile?.profileImage ?? null,
            })),
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                senderId: lastMessage.senderId,
              }
            : null,
          unreadCount, // ✅ now a NUMBER
        };
      }),
    );
  }
  

}
