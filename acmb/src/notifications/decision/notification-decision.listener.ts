/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationEvent } from '../events/notification-event.interface';
import { NotificationDecisionService } from './notification-decision.service';

@Injectable()
export class NotificationDecisionListener {
  constructor(private readonly decisionService: NotificationDecisionService) {}

  @OnEvent('notification.event')
  async handle(event: NotificationEvent) {
    console.log('EVENT RECEIVED', event); 
    await this.decisionService.process(event);
  }
}
