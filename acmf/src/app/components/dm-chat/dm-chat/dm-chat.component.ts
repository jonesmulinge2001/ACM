import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  EventEmitter,
  Output,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Conversation, ConversationMessage } from '../../../interfaces';
import { ConversationsService } from '../../../services/conversations.service';
import { DmSocketService } from '../../../services/dm-socket.service';

@Component({
  selector: 'app-dm-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dm-chat.component.html',
  styleUrls: ['./dm-chat.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DmChatComponent implements OnInit, OnDestroy {
  /** Open by participant (start or resume 1:1) */
  @Input() participantId?: string;

  /** Open by existing conversationId */
  @Input() conversationId?: string;

  @Output() close = new EventEmitter<void>();

  conversation?: Conversation;
  messages: ConversationMessage[] = [];
  newMessage = '';

  participantName = '';
  participantImage = '/assets/default-avatar.png';

  myId: string = localStorage.getItem('userId') || '';

  private sub = new Subscription();

  constructor(
    private convos: ConversationsService,
    private socket: DmSocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.socket.connect();
    console.log('[DmChat] init', { conversationId: this.conversationId, participantId: this.participantId });

    if (this.conversationId) {
      // Case 1: Open existing conversation
      this.loadConversation(this.conversationId);
    } else if (this.participantId) {
      // Case 2: Create or fetch one-on-one
      this.sub.add(
        this.convos.createOneOnOne(this.participantId).subscribe(convo => {
          this.conversation = convo;
          this.setupParticipantInfo(convo);
          this.joinAndLoad(convo.id);
        }),
      );
    }
  }

  /** Extract other participant info */
  private setupParticipantInfo(convo: Conversation): void {
    console.log('[DmChat] setupParticipantInfo', convo.participants);
    const other = convo.participants.find(p => p.id !== this.myId);
    this.participantName = other?.name || 'Unknown';
    this.participantImage = other?.profileImage || '/assets/default-avatar.png';
    this.cdr.markForCheck();
  }

  /** Load existing conversation */
/** Load existing conversation */
private loadConversation(convoId: string): void {
  this.sub.add(
    this.convos.getConversation(convoId).subscribe(convo => {
      this.conversation = convo as Conversation;
      this.setupParticipantInfo(convo);
      this.joinAndLoad(this.conversation.id);
    }),
  );
}

  /** Join socket + load messages + listen */
  private joinAndLoad(convoId: string): void {
    this.socket.join(convoId);

    // Load past messages
    this.sub.add(
      this.convos.getMessages(convoId).subscribe(msgs => {
        // Server returns newest first → reverse to oldest first
        this.messages = msgs.reverse();
        console.log('[DmChat] loaded messages', this.messages);
        this.cdr.markForCheck(); // force update (because of OnPush)
      }),
    );
    

    // Live updates
    this.sub.add(
      this.socket.onMessage().subscribe(msg => {
        if (msg.conversationId === convoId) {
          this.messages = [...this.messages, msg];
        }
      }),
    );
  }

/** Send message */
sendMessage(): void {
  if (!this.newMessage.trim() || !this.conversation) return;

  const convoId = this.conversation.id;
  const content = this.newMessage.trim();

  // Optimistic UI update
  const tempMsg: ConversationMessage = {
    id: 'temp-' + Date.now(),
    conversationId: convoId,
    content,
    createdAt: new Date().toISOString(),
    senderId: this.myId,
    sender: {
      id: this.myId,
      name: 'You',
      profileImage: localStorage.getItem('profileImage') || undefined,
    },
  };

  this.messages = [...this.messages, tempMsg];
  this.newMessage = '';
  this.cdr.markForCheck();

  // 🚀 Use REST API to persist
  this.sub.add(
    this.convos.sendMessage(convoId, content).subscribe({
      next: saved => {
        // Replace temp message with real saved one
        this.messages = this.messages.map(m =>
          m.id === tempMsg.id ? saved : m
        );
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('[DmChat] sendMessage error', err);
        // Roll back optimistic message if failed
        this.messages = this.messages.filter(m => m.id !== tempMsg.id);
        this.cdr.markForCheck();
      },
    }),
  );
}


  ngOnDestroy(): void {
    if (this.conversation) {
      this.socket.leave(this.conversation.id);
    }
    this.sub.unsubscribe();
  }
}
