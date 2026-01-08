/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import {  IsOptional, IsString } from 'class-validator';

export class CreateGroupResourceDto {
  // Only required if no file/resourceUrl is provided
  @IsString()
  @IsOptional()
  content: string;

  // Optional file URL
  // @IsOptional()
  // @IsString()
  // resourceUrl?: string;
}
