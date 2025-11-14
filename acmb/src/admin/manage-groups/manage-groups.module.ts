import { Module } from '@nestjs/common';
import { ManageGroupsService } from './manage-groups.service';
import { ManageGroupsController } from './manage-groups.controller';

@Module({
  providers: [ManageGroupsService],
  controllers: [ManageGroupsController],
})
export class ManageGroupsModule {}
