/* eslint-disable prettier/prettier */
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsObject,
} from 'class-validator';
import { IntentType, Prisma } from 'generated/prisma/client';

export class CreateIntentDto {
  @IsString()
  type: IntentType;

  @IsInt()
  @Min(1)
  @Max(5)
  priority: number;

  @IsOptional()
  @IsObject()
  context?: Prisma.InputJsonValue;
}
