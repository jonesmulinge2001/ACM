/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prettier/prettier */
 
import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtService } from 'src/guards/jwt/jwt.service';
import { SendMessageDto } from 'src/dto/send-message.dto';

@WebSocketGateway({
  namespace: '/groups',
  cors: { origin: '*' },
})
export class GroupsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger(GroupsGateway.name);

  constructor(
    private readonly groupsService: GroupsService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('GroupsGateway initialized');
  }

  async handleConnection(client: Socket) {
    // Extract token from query or headers (client should send token)
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verifyToken(token);
      client.data.user = { id: payload.sub, name: payload.email };

      this.logger.log(`Client connected: ${client.id} (user ${payload.sub})`);
    } catch (err) {
      this.logger.warn(
        `Authentication failed for socket ${client.id}`,
        err?.message,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Join a group room so the socket receives group messages.
   * Client should request: { groupId }
   */
  @SubscribeMessage('join')
  async onJoin(
    @MessageBody() data: { groupId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    // ensure membership
    const member = await this.groupsService['prisma'].groupMember.findUnique({
      where: { groupId_userId: { groupId: data.groupId, userId: user.id } },
    });

    if (!member) {
      client.emit('error', { message: 'Not a member' });
      return;
    }
    client.join(`group:${data.groupId}`);
    client.emit('joined', { groupId: data.groupId });
  }

  @SubscribeMessage('leave')
  async onLeave(
    @MessageBody() data: { groupId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`group:${data.groupId}`);
    client.emit('left', { groupId: data.groupId });
  }

  /** Client emits 'message' with payload; gateway persists then broadcasts */
  @SubscribeMessage('message')
  async onMessage(@MessageBody() payload: SendMessageDto, @ConnectedSocket() client: Socket) {
    const user = client.data.user;
    try {
      const saved = await this.groupsService.sendMessage(user.id, payload, payload['file']);
      this.server.to(`group:${payload.groupId}`).emit('message', {
        id: saved.id,
        content: saved.content,
        mediaUrl: saved.mediaUrl,
        mediaType: saved.mediaType,
        replyTo: saved.replyTo,
        createdAt: saved.createdAt,
        user: saved.user,
      });
    } catch (err: any) {
      client.emit('error', { message: err.message ?? 'Failed to send message' });
    }
  }
  
}
