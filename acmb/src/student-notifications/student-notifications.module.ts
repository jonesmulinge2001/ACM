import { Module } from '@nestjs/common';
import { StudentNotificationsService } from './student-notifications.service';
import { StudentNotificationsController } from './student-notifications.controller';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  providers: [StudentNotificationsService, NotificationsGateway],
  controllers: [StudentNotificationsController],
  exports: [NotificationsGateway],
})
export class StudentNotificationsModule {}
