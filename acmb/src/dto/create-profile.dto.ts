/* eslint-disable prettier/prettier */
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  institutionId: string;

  @IsString()
  @IsNotEmpty()
  academicLevel: string;

  @IsOptional()
  @IsString()
  course?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsString()
  coverPhoto?: string;

  
}
