import { Module } from '@nestjs/common';
import { ProcessingService } from './processing.service';
import { ProcessingController } from './processing.controller';

@Module({
  providers: [ProcessingService],
  controllers: [ProcessingController],
  exports: [ProcessingService],
})
export class ProcessingModule {}
