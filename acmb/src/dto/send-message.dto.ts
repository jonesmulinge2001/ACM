/* eslint-disable prettier/prettier */
// src/dto/send-group-message.dto.ts
import { IsOptional, IsString, IsUUID, IsArray } from 'class-validator';
import { MessageAttachment } from './message-attachment.dto';

export class SendGroupMessageDto {
  @IsUUID()
  groupId: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUUID()
  replyToId?: string;

  @IsOptional()
  @IsArray()
  attachments?: MessageAttachment[] | null;
}
