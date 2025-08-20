/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { UserManagementController } from './user-management.controller';
import { MailerService } from 'src/shared/mailer/mailer.service';

@Module({
  controllers: [UserManagementController],
  providers: [UserManagementService, MailerService]
})
export class UserManagementModule {}
