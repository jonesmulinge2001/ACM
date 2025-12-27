/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtService } from 'src/guards/jwt/jwt.service';
import { IsString, IsOptional, validateSync, IsArray } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { consumeToken } from 'src/shared/socket-rate-limiter';
import { MessageAttachment } from 'src/dto/message-attachment.dto';

class SendMessageDto {
  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  recipientId?: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsArray()
  attachments?: MessageAttachment[];
}

@WebSocketGateway({
  namespace: '/dm',
  cors: { origin: '*' }, // tighten in production
  // pingTimeout/pingInterval can be tuned
})
export class DmsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger(DmsGateway.name);

  constructor(
    private convService: ConversationsService,
    private jwtService: JwtService,
  ) {}

  afterInit() {
    this.logger.log('DmsGateway initialized');
  }

  private extractToken(client: Socket): string | undefined {
    // prefer auth token from socket client (recommended)
    const fromAuth = client.handshake.auth?.token as string | undefined;
    if (fromAuth) return fromAuth;
    // fallback to Authorization header
    const hdr = client.handshake.headers?.authorization ?? null;
    if (hdr && hdr.startsWith('Bearer ')) return hdr.split(' ')[1];
    // last resort: query param
    return client.handshake.query?.token as string | undefined;
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.emit('error', {
          code: 'NO_TOKEN',
          message: 'No auth token provided',
        });
        client.disconnect(true);
        return;
      }

      // verify token (if verifyToken is sync or async adapt accordingly)
      const payload = await Promise.resolve(this.jwtService.verifyToken(token));
      if (!payload || !payload.sub) {
        client.emit('error', {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        });
        client.disconnect(true);
        return;
      }

      client.data.user = {
        id: payload.sub,
        email: payload.email ?? payload.sub,
      };
      this.logger.log(
        `DM client connected: ${client.id} user:${client.data.user.id}`,
      );
    } catch (err) {
      this.logger.warn('DM auth failed', err?.message ?? err);
      client.emit('error', {
        code: 'AUTH_FAILED',
        message: 'Authentication failed',
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(
      `DM client disconnected ${client.id} user:${client.data?.user?.id ?? 'unknown'}`,
    );
  }

  private ensureJoinedRoom(conversationId: string) {
    return `conv:${conversationId}`;
  }

  @SubscribeMessage('join')
  async onJoin(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      if (!user) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }
      if (!data?.conversationId) {
        client.emit('error', { message: 'conversationId required' });
        return;
      }

      // Use ConversationsService to validate participant
      const p = await this.convService[
        'prisma'
      ].conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: data.conversationId,
            userId: user.id,
          },
        } as any,
      });

      if (!p) {
        client.emit('error', { message: 'Not a participant' });
        return;
      }

      const room = this.ensureJoinedRoom(data.conversationId);
      client.join(room);
      client.emit('joined', { conversationId: data.conversationId });
      this.logger.log(`Socket ${client.id} joined ${room}`);
    } catch (err) {
      this.logger.error('join error', err?.message ?? err);
      client.emit('error', { message: 'Failed to join' });
    }
  }

  @SubscribeMessage('leave')
  onLeave(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.conversationId) return;
    const room = this.ensureJoinedRoom(data.conversationId);
    client.leave(room);
    client.emit('left', { conversationId: data.conversationId });
    this.logger.log(`Socket ${client.id} left ${room}`);
  }

  @SubscribeMessage('message')
  async onMessage(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      if (!user) {
        client.emit('error', { code: 'NO_AUTH', message: 'Not authenticated' });
        return;
      }
  
      // Rate limit check
      const allowed = await consumeToken(user.id);
      if (!allowed) {
        client.emit('error', { code: 'RATE_LIMIT', message: 'Too many messages. Slow down.' });
        return;
      }
  
      // Validate DTO
      const dto = plainToInstance(SendMessageDto, payload);
      const errs = validateSync(dto as object, { whitelist: true, forbidNonWhitelisted: true });
      if (errs.length > 0) {
        client.emit('error', { message: 'Invalid payload', details: errs });
        return;
      }
  
      // Save + broadcast
      const saved = await this.convService.sendMessage(user.id, {
        conversationId: dto.conversationId,
        recipientId: dto.recipientId,
        content: dto.content,
        attachments: payload.attachments ?? null,
      });
  
      const room = this.ensureJoinedRoom(saved.conversationId);
      this.server.to(room).emit('message', saved);
  
      // Ack back to sender
      client.emit('message:sent', {
        tempId: payload.tempId ?? null,
        id: saved.id,
        conversationId: saved.conversationId,
      });
    } catch (err: any) {
      this.logger.error('message error', err?.message ?? err);
      client.emit('error', { message: err?.message ?? 'Failed to send message' });
    }
  }
  

  @SubscribeMessage('typing')
  onTyping(
    @MessageBody() data: { conversationId: string; typing: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user || !data?.conversationId) return;
    this.server.to(`conv:${data.conversationId}`).emit('typing', {
      conversationId: data.conversationId,
      userId: user.id,
      typing: data.typing,
    });
  }

  @SubscribeMessage('read')
  async onRead(
    @MessageBody() data: { conversationId: string; lastReadAt?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user || !data?.conversationId) return;
    try {
      await this.convService.markAsRead(
        data.conversationId,
        user.id,
        data.lastReadAt ? new Date(data.lastReadAt) : undefined,
      );
      this.server.to(`conv:${data.conversationId}`).emit('read', {
        conversationId: data.conversationId,
        userId: user.id,
        lastReadAt: new Date().toISOString(),
      });
    } catch (err) {
      this.logger.error('read error', err?.message ?? err);
    }
  }
}
