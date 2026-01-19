/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationEventsService } from './events/notification-events.service';
import { NotificationDecisionListener } from './decision/notification-decision.listener';
import { NotificationDecisionService } from './decision/notification-decision.service';
import { NotificationStorageService } from './storage/notification-storage.service';
import { NotificationRepository } from './storage/notification.repository';
import { NotificationRealtimeService } from './realtime/notification-realtime.service';
import { NotificationGateway } from './realtime/notification.gateway';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    NotificationEventsService,
    NotificationDecisionListener,
    NotificationDecisionService,
    NotificationRepository,
    NotificationStorageService,
    NotificationGateway,
    NotificationRealtimeService,
  ],
  exports: [NotificationEventsService],
})
export class NotificationsModule {}
