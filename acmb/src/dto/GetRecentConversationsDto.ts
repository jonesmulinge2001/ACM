/* eslint-disable prettier/prettier */
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRecentConversationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
