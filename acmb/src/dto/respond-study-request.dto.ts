/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { StudyRequestStatus } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class RespondStudyRequestDto {
  @IsUUID()
  requestId: string;

  @IsEnum(StudyRequestStatus)
  status: StudyRequestStatus; // ACCEPTED OR DECLINED
}
