/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import {  IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateGroupResourceDto {
  // Only required if no file/resourceUrl is provided
  @ValidateIf((o) => !o.resourceUrl)
  @IsString()
  @IsOptional()
  content: string;

  // Optional file URL
  @IsOptional()
  @IsString()
  resourceUrl?: string;
}
