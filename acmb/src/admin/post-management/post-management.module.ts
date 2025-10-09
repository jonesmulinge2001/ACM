import { Module } from '@nestjs/common';
import { PostManagementService } from './post-management.service';
import { PostManagementController } from './post-management.controller';

@Module({
  providers: [PostManagementService],
  controllers: [PostManagementController],
  exports: [PostManagementService],
})
export class PostManagementModule {}
