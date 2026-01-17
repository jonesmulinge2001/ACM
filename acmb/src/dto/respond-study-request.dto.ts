/* eslint-disable prettier/prettier */
 
import { RequestStatus } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class RespondStudyRequestDto {
  @IsUUID()
  requestId: string;

  @IsEnum(RequestStatus)
  status: RequestStatus; // ACCEPTED OR DECLINED
}
