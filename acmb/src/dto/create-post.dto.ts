/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsOptional, IsString, IsArray, IsEnum } from 'class-validator';
import { PostType } from 'generated/prisma';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(PostType, { message: 'type must be one of GENERAL, ACADEMIC, OPPORTUNITY, RESOURCE' })
  type?: PostType; 

  @IsOptional()
  @IsString()
  fileUrl?: string;
}
