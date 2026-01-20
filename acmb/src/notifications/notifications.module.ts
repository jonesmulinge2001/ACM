/* eslint-disable prettier/prettier */
 
 
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationEventsService } from './events/notification-events.service';
import { NotificationDecisionListener } from './decision/notification-decision.listener';
import { NotificationDecisionService } from './decision/notification-decision.service';
import { NotificationStorageService } from './storage/notification-storage.service';
import { NotificationRepository } from './storage/notification.repository';
import { NotificationRealtimeService } from './realtime/notification-realtime.service';
import { NotificationGateway } from './realtime/notification.gateway';
import { NotificationController } from './api/notification.controller';
import { NotificationService } from './api/notification.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [NotificationController],
  providers: [
    NotificationEventsService,
    NotificationDecisionListener,
    NotificationDecisionService,
    NotificationRepository,
    NotificationStorageService,
    NotificationGateway,
    NotificationRealtimeService,
    NotificationService
  ],
  exports: [NotificationEventsService],
})
export class NotificationsModule {}
