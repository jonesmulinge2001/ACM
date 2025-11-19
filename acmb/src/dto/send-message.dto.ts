/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  groupId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
  replyToId?: string;

  file?: Express.Multer.File;
  fileType?: 'IMAGE' | 'FILE'; 
}
