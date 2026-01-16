/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
 

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
import { JwtService } from '../guards/jwt/jwt.service';
import { plainToInstance } from 'class-transformer';
import { validateSync, IsOptional, IsString, IsArray } from 'class-validator';
import { MessageAttachment } from '../dto/message-attachment.dto';
import { consumeToken } from '../shared/socket-rate-limiter';

class SendMessageDto {
  @IsOptional() @IsString() conversationId?: string;
  @IsOptional() @IsString() recipientId?: string;
  @IsString() content!: string;
  @IsOptional() @IsArray() attachments?: MessageAttachment[];
}

@WebSocketGateway({
  namespace: '/dm',
  cors: { origin: '*' },
})
export class DmsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
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
    const fromAuth = client.handshake.auth?.token as string | undefined;
    if (fromAuth) return fromAuth;
    const hdr = client.handshake.headers?.authorization ?? null;
    if (hdr && hdr.startsWith('Bearer ')) return hdr.split(' ')[1];
    return client.handshake.query?.token as string | undefined;
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) throw new Error('No token');

      const payload = await Promise.resolve(this.jwtService.verifyToken(token));
      if (!payload?.sub) throw new Error('Invalid token');

      client.data.user = { id: payload.sub, email: payload.email ?? payload.sub };
      this.logger.log(`DM client connected: ${client.id} user:${client.data.user.id}`);
    } catch (err) {
      this.logger.warn('DM auth failed', err?.message ?? err);
      client.emit('error', { code: 'AUTH_FAILED', message: 'Authentication failed' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`DM client disconnected ${client.id} user:${client.data?.user?.id ?? 'unknown'}`);
  }

  private roomName(conversationId: string) {
    return `conv:${conversationId}`;
  }

  @SubscribeMessage('join')
  async onJoin(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) return client.emit('error', { message: 'Not authenticated' });
    if (!data?.conversationId) return client.emit('error', { message: 'conversationId required' });

    const participant = await this.convService['prisma'].conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: data.conversationId, userId: user.id } as any },
    });
    if (!participant) return client.emit('error', { message: 'Not a participant' });

    const room = this.roomName(data.conversationId);
    client.join(room);
    client.emit('joined', { conversationId: data.conversationId });
    this.logger.log(`Socket ${client.id} joined ${room}`);
  }

  @SubscribeMessage('leave')
  onLeave(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.conversationId) return;
    const room = this.roomName(data.conversationId);
    client.leave(room);
    client.emit('left', { conversationId: data.conversationId });
    this.logger.log(`Socket ${client.id} left ${room}`);
  }

  @SubscribeMessage('message')
  async onMessage(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) return client.emit('error', { code: 'NO_AUTH', message: 'Not authenticated' });

    const allowed = await consumeToken(user.id);
    if (!allowed) return client.emit('error', { code: 'RATE_LIMIT', message: 'Too many messages. Slow down.' });

    const dto = plainToInstance(SendMessageDto, payload);
    const errs = validateSync(dto as object, { whitelist: true, forbidNonWhitelisted: true });
    if (errs.length > 0) return client.emit('error', { message: 'Invalid payload', details: errs });

    const savedMessage = await this.convService.sendMessage(user.id, {
      conversationId: dto.conversationId,
      recipientId: dto.recipientId,
      content: dto.content,
      attachments: dto.attachments ?? null,
    });

    const room = this.roomName(savedMessage.conversationId);

    // **Automatically join sender if not already in room**
    if (!client.rooms.has(room)) client.join(room);

    // Broadcast to all participants in conversation
    this.server.to(room).emit('message', savedMessage);

    // Acknowledge sender
    client.emit('message:sent', {
      tempId: payload.tempId ?? null,
      id: savedMessage.id,
      conversationId: savedMessage.conversationId,
    });
  }
}
