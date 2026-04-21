/* eslint-disable prettier/prettier */
import { IsEnum, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export enum MaterialType {
  NOTES = 'NOTES',
  PAST_PAPER = 'PAST_PAPER',
  ASSIGNMENT = 'ASSIGNMENT',
}

export class CreateAcademicResourceDto {
  @IsString({ message: 'Title must be a string' })
  @Length(3, 100, { message: 'Title must be between 3 and 100 characters' })
  title: string;

  @IsOptional()
  @IsUrl({}, { message: 'fileUrl must be a valid URL' })
  fileUrl?: string;

  @IsEnum(MaterialType)
  type: MaterialType;
}
