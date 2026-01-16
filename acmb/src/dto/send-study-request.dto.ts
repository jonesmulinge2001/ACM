/* eslint-disable prettier/prettier */
import { IsUUID } from 'class-validator';

export class SendStudyRequestDto {
  @IsUUID()
  receiverId: string;
}
