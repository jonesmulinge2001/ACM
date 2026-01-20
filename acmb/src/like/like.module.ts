/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [LikeService],
  controllers: [LikeController]
})
export class LikeModule {}
