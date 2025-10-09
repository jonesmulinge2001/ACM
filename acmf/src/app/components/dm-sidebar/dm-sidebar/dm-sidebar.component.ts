// src/app/components/dm-sidebar/dm-sidebar.component.ts
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation, ConversationSummary } from '../../../interfaces';
import { ConversationsService } from '../../../services/conversations.service';

@Component({
  selector: 'app-dm-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dm-sidebar.component.html',
  styleUrls: ['./dm-sidebar.component.css'],
})
export class DmSidebarComponent implements OnInit {
  conversations: ConversationSummary[] = [];
  loading = false;

  @Output() openChat = new EventEmitter<string>(); // emits conversationId

  constructor(private convos: ConversationsService) {}

  ngOnInit(): void {
    this.fetchConversations();
  }

  fetchConversations(): void {
    this.loading = true;
    this.convos.list().subscribe({
      next: convos => {
        this.conversations = convos;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  open(convoId: string): void {
    this.openChat.emit(convoId);
  }

  // For one-on-one chats, pick the other student
  getOtherParticipant(convo: ConversationSummary) {
    const myId = localStorage.getItem('userId');
    return convo.participants.find(p => p.userId !== myId)?.user;
  }
  
}
