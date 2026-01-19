/* eslint-disable prettier/prettier */
import { NotificationEventType } from './notification-event.type';

export interface NotificationEvent {
  type: NotificationEventType;
  actorId: string;
  recipientId: string;
  entityId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
