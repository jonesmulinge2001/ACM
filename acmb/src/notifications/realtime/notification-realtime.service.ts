/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationRealtimeService {
  constructor(private readonly gateway: NotificationGateway) {}

  emitToUser(userId: string, payload: any) {
    this.gateway.server.to(`user:${userId}`).emit('notification', payload);
  }
}
