/* eslint-disable prettier/prettier */
import { NotificationEventType } from '../events/notification-event.type';

export const ALWAYS_NOTIFY_EVENTS: NotificationEventType[] = [
  NotificationEventType.FOLLOWED,
  NotificationEventType.MESSAGE_SENT,
];

export const AGGREGATABLE_EVENTS: NotificationEventType[] = [
  NotificationEventType.POST_LIKED,
  NotificationEventType.POST_COMMENTED,
];
