/* eslint-disable prettier/prettier */
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/* eslint-disable prettier/prettier */
export enum GroupVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export class CreateGroupDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsOptional()
    @IsString()
    coverImage?: string;

    @IsOptional()
    @IsEnum(GroupVisibility)
    visibility?: GroupVisibility = GroupVisibility.PUBLIC;
}