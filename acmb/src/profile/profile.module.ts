import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';

import { CloudinaryModule } from '../shared/cloudinary/cloudinary/cloudinary.module';
import { PermissionModule } from '../permissions/permission.module';
import { ProfileController } from './profile.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  providers: [ProfileService],
  controllers: [ProfileController],
  imports: [CloudinaryModule, PermissionModule, NotificationsModule],
})
export class ProfileModule {}
