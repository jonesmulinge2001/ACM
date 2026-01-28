/* eslint-disable prettier/prettier */
export class RecentConversationParticipantDto {
  id: string;
  name: string;
  profileImage?: string | null;
}

export class RecentConversationMessageDto {
  content: string | null;
  createdAt: Date;
  senderId: string;
}

export class RecentConversationResponseDto {
  conversationId: string;
  isGroup: boolean;
  title?: string | null;
  participants: RecentConversationParticipantDto[];
  lastMessage: RecentConversationMessageDto | null;
  unreadCount: number;
}
