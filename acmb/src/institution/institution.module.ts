/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { InstitutionController } from './institution.controller';
import { AcademeetCloudinaryService } from 'src/shared/cloudinary/cloudinary/cloudinary.service';
import { StudentNotificationsModule } from 'src/student-notifications/student-notifications.module';

@Module({
  imports: [StudentNotificationsModule],
  providers: [InstitutionService, AcademeetCloudinaryService],
  controllers:[InstitutionController],
})
export class InstitutionModule {}
