/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateUniTokVideoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    console.log('Tags value received:', value, 'Type:', typeof value);
    
    // If value is undefined or null, return empty array
    if (!value && value !== '') return [];
    
    // If already an array, return it
    if (Array.isArray(value)) return value;
    
    // If it's a string
    if (typeof value === 'string') {
      // Trim the string
      const trimmed = value.trim();
      
      // If empty string, return empty array
      if (trimmed === '') return [];
      
      // Try to parse as JSON (handles "[\"HELB\",\"Study Tips\"]")
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // If JSON parsing fails, try comma-separated
        return trimmed.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    }
    
    // Default fallback
    return [];
  })
  @IsString({ each: true })
  tags?: string[] = []; // Add default value
}