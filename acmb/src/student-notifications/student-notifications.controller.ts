/* eslint-disable prettier/prettier */
import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { RequestWithUser } from '../interfaces/requestwithUser.interface';
import { StudentNotificationsService } from './student-notifications.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('student-notifications')
 @UseGuards(AuthGuard('jwt'))
export class StudentNotificationsController {
  constructor(
    private readonly studentNotificationService: StudentNotificationsService,
  ) {}

  /** Get all notifications for logged-in student */
  @Get('notifications')
  getNotifications(@Req() req: RequestWithUser) {
    return this.studentNotificationService.getNotifications(req.user.id);
  }

  /** Get all unread notifications */
  @Get('notifications/unread')
  getUnreadNotifications(@Req() req: RequestWithUser) {
    return this.studentNotificationService.getUnreadNotifications(req.user.id);
  }

  /** Mark a notification as read */
  @Patch('notifications/:notificationId/read')
  markNotificationAsRead(
    @Param('notificationId') notificationId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.studentNotificationService.markNotificationAsRead(
      notificationId,
      req.user.id,
    );
  }

  /** Get all announcements for student's institution */
  @Get('announcements')
  getInstitutionAnnouncements(@Req() req: RequestWithUser) {
    return this.studentNotificationService.getInstitutionAnnouncements(
      req.user.id,
    );
  }
}
