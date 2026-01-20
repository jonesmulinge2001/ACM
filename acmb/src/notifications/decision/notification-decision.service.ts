/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { NotificationEvent } from '../events/notification-event.interface';
import {
  ALWAYS_NOTIFY_EVENTS,
  AGGREGATABLE_EVENTS,
} from './notification-priority.map';
import { NotificationStorageService } from '../storage/notification-storage.service';

@Injectable()
export class NotificationDecisionService {
  constructor(
    private readonly storage: NotificationStorageService
  ) {}
  async process(event: NotificationEvent): Promise<void> {
    console.log('DECISION SERVICE CALLED', event); 
    // Ignore self-events
    if (event.actorId === event.recipientId) {
      return;
    }

    // Always-notify events
    if (ALWAYS_NOTIFY_EVENTS.includes(event.type)) {
      console.log('ALWAYS_NOTIFY — storing event', event); 
        await this.storage.store(event, false);
        return;
      }

    // Aggregatable events
    if (AGGREGATABLE_EVENTS.includes(event.type)) {
        await this.storage.store(event, true);
      }

  }
}
