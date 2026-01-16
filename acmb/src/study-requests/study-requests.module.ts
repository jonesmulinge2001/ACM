import { Module } from '@nestjs/common';
import { StudyRequestsService } from './study-requests.service';
import { StudyRequestsController } from './study-requests.controller';

@Module({
  providers: [StudyRequestsService],
  controllers: [StudyRequestsController]
})
export class StudyRequestsModule {}
