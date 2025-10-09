/* eslint-disable prettier/prettier */
import { IsString, Length, Matches, IsNotEmpty } from 'class-validator';

export class CreateAcademicResourceDto {
  @IsString({ message: 'Title must be a string' })
  @Length(3, 100, { message: 'Title must be between 3 and 100 characters' })
  title: string;

  @IsString({ message: 'Description must be a string' })
  @Length(10, 500, {
    message: 'Description must be between 10 and 500 characters',
  })
  description: string;

  @IsString({ message: 'Course must be a string' })
  @Length(2, 50, { message: 'Course must be between 2 and 50 characters' })
  course: string;

  @IsString({ message: 'Unit name must be a string' })
  @Length(2, 100, { message: 'Unit name must be between 2 and 100 characters' })
  unitName: string;

  @IsString({ message: 'Semester must be a string' })
  @IsNotEmpty({message: 'Semester is required' })
  semester: string;

  @IsString({ message: 'Year must be a string' })
  @IsNotEmpty({message: 'Year is required' })
  @Matches(/^[0-9]{4}$/, {
    message: 'Year must be a 4-digit number (e.g., 2025)',
  })
  year: string;

  @IsString({ message: 'Institution must be a string' })
  @Length(2, 100, {
    message: 'Institution must be between 2 and 100 characters',
  })
  institution: string;
}
