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
import { Conversation, ConversationMessage, MessageAttachment } from '../../../interfaces';
import { ConversationsService, FileUploadProgress } from '../../../services/conversations.service';
import { DmSocketService } from '../../../services/dm-socket.service';

interface AttachmentUI {
  file: File;
  previewUrl?: string;
  progress?: number;
  uploadedUrl?: string;
  type: 'IMAGE' | 'VIDEO' | 'FILE';
}

interface MessageAttachmentUI extends MessageAttachment {
  progress?: number;
  previewUrl?: string; // optional, for frontend preview
}

@Component({
  selector: 'app-dm-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dm-chat.component.html',
  styleUrls: ['./dm-chat.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DmChatComponent implements OnInit, OnDestroy {
  @Input() participantId?: string;
  @Input() conversationId?: string;
  @Output() close = new EventEmitter<void>();

  conversation?: Conversation;
  messages: ConversationMessage[] = [];
  newMessage = '';

  participantName = '';
  participantImage = '/assets/default-avatar.png';
  myId: string = localStorage.getItem('userId') || '';

  private sub = new Subscription();
  selectedAttachments: AttachmentUI[] = [];
  isTyping = false;
  typingUsers: string[] = [];

  constructor(
    private convos: ConversationsService,
    private socket: DmSocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.socket.connect();

    if (this.conversationId) this.loadConversation(this.conversationId);
    else if (this.participantId) this.createOrLoadConversation();
    
    // Typing indicator subscription
    this.sub.add(
      this.socket.onTyping().subscribe(event => {
        if (this.conversation && event.conversationId === this.conversation.id) {
          if (event.userId !== this.myId) {
            this.typingUsers = event.typing
              ? [event.userId]
              : this.typingUsers.filter(id => id !== event.userId);
            this.cdr.markForCheck();
          }
        }
      })
    );
  }

  private createOrLoadConversation() {
    this.sub.add(
      this.convos.createOneOnOne(this.participantId!).subscribe(convo => {
        this.conversation = convo;
        this.setupParticipantInfo(convo);
        this.joinAndLoad(convo.id);
      })
    );
  }

  private loadConversation(convoId: string) {
    this.sub.add(
      this.convos.getConversation(convoId).subscribe(convo => {
        this.conversation = convo;
        this.setupParticipantInfo(convo);
        this.joinAndLoad(convo.id);
      })
    );
  }

  private setupParticipantInfo(convo: Conversation): void {
    const other = convo.participants.find(p => p.id !== this.myId);
    this.participantName = other?.name || 'Unknown';
    this.participantImage = other?.profileImage || '/assets/default-avatar.png';
    this.cdr.markForCheck();
  }

  private joinAndLoad(convoId: string) {
    this.socket.join(convoId);

    // Load past messages
    this.sub.add(
      this.convos.getMessages(convoId).subscribe(msgs => {
        this.messages = msgs.reverse();
        this.cdr.markForCheck();
      })
    );

    // Listen for live messages
    this.sub.add(
      this.socket.onMessage().subscribe(msg => {
        if (msg.conversationId === convoId) {
          this.messages = [...this.messages, msg];
          this.cdr.markForCheck();
        }
      })
    );
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    // convert to AttachmentUI
    const newAttachments: AttachmentUI[] = Array.from(input.files).map(file => {
      let previewUrl: string | undefined;
      let type: 'IMAGE' | 'VIDEO' | 'FILE' = 'FILE';
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
        type = 'IMAGE';
      } else if (file.type.startsWith('video/')) {
        previewUrl = URL.createObjectURL(file);
        type = 'VIDEO';
      }
      return { file, previewUrl, type, progress: 0 };
    });

    this.selectedAttachments.push(...newAttachments);
    this.cdr.markForCheck();
  }

  removeAttachment(index: number) {
    const att = this.selectedAttachments[index];
    if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
    this.selectedAttachments.splice(index, 1);
    this.cdr.markForCheck();
  }

  sendMessage(): void {
    if (!this.newMessage.trim() && this.selectedAttachments.length === 0) return;
    if (!this.conversation) return;

    const convoId = this.conversation.id;
    const content = this.newMessage.trim();
    const files = this.selectedAttachments.map(a => a.file);

    // Optimistic UI message
    const tempMsg: ConversationMessage = {
      id: 'temp-' + Date.now(),
      conversationId: convoId,
      content,
      attachments: this.selectedAttachments.map(a => ({
        name: a.file.name,
        type: a.file.type,
        url: a.previewUrl || '',
        progress: 0
      })) as MessageAttachmentUI[],
      createdAt: new Date().toISOString(),
      senderId: this.myId,
      sender: { id: this.myId, name: 'You', profileImage: localStorage.getItem('profileImage') || undefined },
    };

    this.messages = [...this.messages, tempMsg];
    this.newMessage = '';
    this.selectedAttachments = [];
    this.cdr.markForCheck();

    // Send via service with progress
    this.sub.add(
      this.convos.sendMessageWithFiles(convoId, content, files, (progress) => {
        tempMsg.attachments?.forEach(a => a.progress = progress);
        this.cdr.markForCheck();
      }).subscribe({
        next: saved => {
          this.messages = this.messages.map(m => m.id === tempMsg.id ? saved : m);
          this.cdr.markForCheck();
        },
        error: err => {
          console.error('[DmChat] sendMessage error', err);
          this.messages = this.messages.filter(m => m.id !== tempMsg.id);
          this.cdr.markForCheck();
        },
      })
    );

    // Notify typing stopped
    this.socket.sendTyping(convoId, false);
  }

  onInputChange() {
    if (!this.conversation) return;
    const typing = !!this.newMessage.trim();
    if (typing !== this.isTyping) {
      this.isTyping = typing;
      this.socket.sendTyping(this.conversation.id, typing);
    }
  }

  ngOnDestroy(): void {
    if (this.conversation) this.socket.leave(this.conversation.id);
    this.sub.unsubscribe();

    // Revoke any preview URLs
    this.selectedAttachments.forEach(a => {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    });
  }
}
