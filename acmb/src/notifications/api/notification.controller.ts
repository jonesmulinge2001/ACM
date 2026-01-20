/* eslint-disable prettier/prettier */
import { Controller, Get, Patch, Param, Query, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { RequestWithUser } from '../../interfaces/requestwithUser.interface';
import { JwtAuthGuard } from '../../guards/jwt/jwtAuth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  async getNotifications(@Query('cursor') cursor: string, @Req() req: RequestWithUser,) {
    return this.service.getNotifications(req.user.id, cursor);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: RequestWithUser,) {
    return {
      count: await this.service.getUnreadCount(req.user.id),
    };
  }

  @Patch(':id/seen')
  async markAsSeen(@Param('id') id: string, @Req() req: RequestWithUser,) {
    return this.service.markAsSeen(req.user.id, id);
  }

  @Patch('seen-all')
  async markAllAsSeen(@Req() req: RequestWithUser,) {
    return this.service.markAllAsSeen(req.user.id);
  }
}
