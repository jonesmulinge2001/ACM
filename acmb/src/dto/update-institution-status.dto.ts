/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { IsEnum, IsNotEmpty } from 'class-validator';
import { InstitutionStatus } from 'generated/prisma';

export class UpdateInstitutionStatusDto {
  @IsEnum(InstitutionStatus)
  status: InstitutionStatus;

  @IsNotEmpty()
  adminId: string; // super admin performing the action
}
