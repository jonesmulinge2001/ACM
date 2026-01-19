/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
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
  constructor(private readonly storage: NotificationStorageService) {}
  async process(event: NotificationEvent): Promise<void> {
    // 1️⃣ Ignore self-events
    if (event.actorId === event.recipientId) {
      return;
    }

    // 2️⃣ Always-notify events
    if (ALWAYS_NOTIFY_EVENTS.includes(event.type)) {
        await this.storage.store(event, false);
        return;
      }

    // 3️⃣ Aggregatable events
    if (AGGREGATABLE_EVENTS.includes(event.type)) {
        await this.storage.store(event, true);
      }

  }

  private async createNotification(
    event: NotificationEvent,
    aggregatable: boolean,
  ) {
    /**
     * For now:
     * - We only decide WHAT should happen
     * - Actual DB storage comes in Step 3
     */
    console.log('[NotificationDecision]', {
      type: event.type,
      recipient: event.recipientId,
      aggregatable,
    });
  }
}
