/* eslint-disable prettier/prettier */
import { Express } from "express";

export class SendConversationMessageDto {
  conversationId?: string;
  recipientId?: string;
  content!: string;
  attachments?: Express.Multer.File[]
}
