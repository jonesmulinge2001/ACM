/* eslint-disable prettier/prettier */
export class CreateConversationDto {
  participantIds!: string[];
  title?: string;
  isGroup?: boolean;
}
