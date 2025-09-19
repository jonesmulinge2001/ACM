import { Module } from '@nestjs/common';
import { StudentNotificationsService } from './student-notifications.service';
import { StudentNotificationsController } from './student-notifications.controller';

@Module({
  providers: [StudentNotificationsService],
  controllers: [StudentNotificationsController],
})
export class StudentNotificationsModule {}
