/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvent } from './notification-event.interface';

@Injectable()
export class NotificationEventsService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit(event: NotificationEvent) {
    this.eventEmitter.emit('notification.event', event);
  }
}
