/* eslint-disable prettier/prettier */
import { NotificationType } from 'generated/prisma';

/* eslint-disable prettier/prettier */
export class StudentNotificationDto {
  id: string;
  recipientId: string;
  type: NotificationType;
  referenceId: string | null;
  message: string;
  status: 'UNREAD' | 'READ';
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date | null;
}
