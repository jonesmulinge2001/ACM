/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AcademeetCloudinaryService } from './cloudinary.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [AcademeetCloudinaryService],
  exports: [AcademeetCloudinaryService],
})
export class CloudinaryModule {}
