/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ShareResourceDto {
  @IsUUID()
  groupId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  resourceurl: string;

  @IsOptional()
  @IsString()
  description?: string;
}
