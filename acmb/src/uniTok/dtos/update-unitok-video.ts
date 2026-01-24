/* eslint-disable prettier/prettier */
import {
  IsArray,
  
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateUniTokVideoDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
