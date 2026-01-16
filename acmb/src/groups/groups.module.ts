import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { CloudinaryModule } from '../shared/cloudinary/cloudinary/cloudinary.module';
import { GroupsGateway } from './groups.gateway';
import { JwtModule } from '../guards/jwt/jwt.module';

@Module({
  imports: [CloudinaryModule, JwtModule],
  providers: [GroupsService, GroupsGateway],
  controllers: [GroupsController],
})
export class GroupsModule {}
