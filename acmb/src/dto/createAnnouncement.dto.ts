/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { Express } from 'express'; 
export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  // Files are handled separately by multer, not validated here
  @IsOptional()
  files?: Express.Multer.File[];
}
