import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { CloudinaryModule } from 'src/shared/cloudinary/cloudinary/cloudinary.module';

@Module({
  providers: [ConversationsService, CloudinaryModule],
  controllers: [ConversationsController],
  imports: [CloudinaryModule],
})
export class ConversationsModule {}
