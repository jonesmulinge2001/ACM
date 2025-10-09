import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';

import { CloudinaryModule } from 'src/shared/cloudinary/cloudinary/cloudinary.module';
import { PermissionModule } from 'src/permissions/permission.module';
import { ProfileController } from './profile.controller';

@Module({
  providers: [ProfileService],
  controllers: [ProfileController],
  imports: [CloudinaryModule, PermissionModule],
})
export class ProfileModule {}
