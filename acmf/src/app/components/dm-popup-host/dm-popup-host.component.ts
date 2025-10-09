import { Component } from '@angular/core';
import { Conversation } from '../../interfaces';
import { ConversationsService } from '../../services/conversations.service';
import { CommonModule } from '@angular/common';
import { DmChatComponent } from "../dm-chat/dm-chat/dm-chat.component";
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  imports: [CommonModule, DmChatComponent, ReactiveFormsModule],
  selector: 'app-dm-popup-host',
  templateUrl: './dm-popup-host.component.html',
  styleUrls: ['./dm-popup-host.component.css'],
})
export class DmPopupHostComponent {
  openChats: Conversation[] = [];

  constructor(private convos: ConversationsService) {}

  /** Called from parent when user clicks "Message" */
  async openForUser(userId: string) {
    this.convos.createOneOnOne(userId).subscribe(convo => {
      if (!this.openChats.find(c => c.id === convo.id)) {
        this.openChats.push(convo);
      }
    });
  }

  close(convoId: string) {
    this.openChats = this.openChats.filter(c => c.id !== convoId);
  }

  getOtherParticipantId(convo: Conversation): string {
    const myId = localStorage.getItem('userId');
    const other = convo.participants.find(p => p.userId !== myId || p.id !== myId);
    return other?.userId || other?.id || '';
  }
  
}
