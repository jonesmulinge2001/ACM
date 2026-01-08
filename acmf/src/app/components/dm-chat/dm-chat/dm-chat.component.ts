import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  EventEmitter,
  Output,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, filter } from 'rxjs';
import {
  Conversation,
  ConversationMessage,
  MessageAttachment,
} from '../../../interfaces';
import {
  ConversationsService,
  FileUploadProgress,
} from '../../../services/conversations.service';
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

  @ViewChild('messagesContainer')
  private messagesContainer!: ElementRef<HTMLDivElement>;
  // @ViewChild('fileInput', { static: false})

  conversation?: Conversation;
  messages: ConversationMessage[] = [];
  newMessage = '';

  participantName = '';
  participantImage = '/assets/default-avatar.png';
  myId!: string;

  private sub = new Subscription();
  selectedAttachments: AttachmentUI[] = [];
  isTyping = false;
  typingUsers: string[] = [];
  showNewMessageButton: boolean = false;
  currentUserId: string | null = null;
  menuOpen: Record<string, boolean> = {};

  // delete modal
  showDeleteModal: boolean = false;
  messageToDelete: ConversationMessage | null = null;

  // edit modal
  showEditModal: boolean = false;
  editedMessage: string = '';
  editingMessageId: string | null = null;

  // reply
  replyingTo: ConversationMessage | null = null;
  

  isChatVisible = true;

  constructor(
    private convos: ConversationsService,
    private socket: DmSocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('conversationId:', this.conversationId, 'participantId:', this.participantId);

    this.myId = localStorage.getItem('userId')!;
    this.socket.connect();

    if (this.conversationId) this.loadConversation(this.conversationId);
    else if (this.participantId) this.createOrLoadConversation();

    // Typing indicator subscription
    this.sub.add(
      this.socket.onTyping().subscribe((event) => {
        if (
          this.conversation &&
          event.conversationId === this.conversation.id
        ) {
          if (event.userId !== this.myId) {
            this.typingUsers = event.typing
              ? [event.userId]
              : this.typingUsers.filter((id) => id !== event.userId);
            this.cdr.markForCheck();
            if (this.isNearBottom()) this.scrollToBottom();
            else this.showNewMessageButton = true;
          }
        }
      })
    );
  }

  private createOrLoadConversation() {
    this.sub.add(
      this.convos.createOneOnOne(this.participantId!).subscribe((convo) => {
        this.conversation = convo;
        this.setupParticipantInfo(convo);
        this.joinAndLoad(convo.id);
      })
    );
  }

  private loadConversation(convoId: string) {
    this.sub.add(
      this.convos.getConversation(convoId).subscribe((convo) => {
        this.conversation = convo;
        this.setupParticipantInfo(convo);
        this.joinAndLoad(convo.id);
      })
    );
  }

  private setupParticipantInfo(convo: Conversation): void {
    const other = convo.participants.find((p) => p.id !== this.myId);
    this.participantName = other?.name || 'Recipient';
    this.participantImage = other?.profileImage || '/assets/default-avatar.png';
    this.cdr.markForCheck();
  }

  private joinAndLoad(convoId: string) {
    // 1. Join conversation safely
    this.socket.join(convoId);

    // 2. Load past messages
    this.sub.add(
      this.convos.getMessages(convoId).subscribe((msgs) => {
        this.messages = msgs.reverse();
        this.cdr.markForCheck();
      })
    );

    // 3. Live message subscription
    this.sub.add(
      this.socket.onMessage().subscribe((msg) => {
        if (!this.conversation) return;
        // Compare as strings to avoid type mismatch
        if (msg.conversationId.toString() === this.conversation.id.toString()) {
          this.messages = [...this.messages, msg];
          this.cdr.markForCheck();
        }
      })
    );

    // 4. Typing indicator
    this.sub.add(
      this.socket.onTyping().subscribe((event) => {
        if (!this.conversation) return;
        if (
          event.conversationId.toString() === this.conversation.id.toString()
        ) {
          const userId = event.userId;
          this.typingUsers = event.typing
            ? [...new Set([...this.typingUsers, userId])]
            : this.typingUsers.filter((id) => id !== userId);
          this.cdr.markForCheck();
        }
      })
    );
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    // convert to AttachmentUI
    const newAttachments: AttachmentUI[] = Array.from(input.files).map(
      (file) => {
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
      }
    );

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
    if (!this.newMessage.trim() && this.selectedAttachments.length === 0)
      return;
    if (!this.conversation) return;

    const convoId = this.conversation.id;
    const content = this.newMessage.trim();
    const files = this.selectedAttachments.map((a) => a.file);

    // 1. Optimistic UI message
    const tempMsg: ConversationMessage = {
      id: 'temp-' + Date.now(),
      conversationId: convoId,
      content,
      attachments: this.selectedAttachments.map((a) => ({
        name: a.file.name,
        type: a.file.type,
        url: a.previewUrl || '',
        progress: 0,
      })) as MessageAttachmentUI[],
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
    this.selectedAttachments = [];
    this.cdr.markForCheck();
    this.scrollToBottom();

    // 2. Upload + save via service (still needed for DB + attachments)
    this.sub.add(
      this.convos
        .sendMessageWithFiles(convoId, content, files, (progress) => {
          tempMsg.attachments?.forEach((a) => (a.progress = progress));
          this.cdr.markForCheck();
        })
        .subscribe({
          next: (saved) => {
            // Replace optimistic message with DB-confirmed message
            this.messages = this.messages.map((m) =>
              m.id === tempMsg.id ? saved : m
            );
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('[DmChat] sendMessage error', err);
            this.messages = this.messages.filter((m) => m.id !== tempMsg.id);
            this.cdr.markForCheck();
          },
        })
    );

    // 3. Stop typing notification
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
    this.selectedAttachments.forEach((a) => {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    });
  }

  // scroll and UI
  private scrollToBottom() {
    setTimeout(() => {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.showNewMessageButton = false;
      this.cdr.markForCheck();
    }, 50);
  }

  private isNearBottom(): boolean {
    const ele = this.messagesContainer.nativeElement;
    const threshold = 100;
    return ele.scrollHeight - ele.scrollTop - ele.clientHeight < threshold;
  }

  jumpToBottom() {
    this.scrollToBottom();
  }

  isMyMessage(m: ConversationMessage): boolean {
    return m.senderId.toString() === this.myId;
  }

  // menu handlers
  toggleMenu(id: string) {
    this.menuOpen[id] = !this.menuOpen[id];
    this.cdr.markForCheck();
  }

  closeAllMenus() {
    this.menuOpen = {};
    this.cdr.markForCheck();
  }

  // Edit Modal
  openEditModal(message: ConversationMessage) {
    if (message.senderId.toString() !== this.myId) return;
    this.closeAllMenus();
    this.editedMessage = message.content;
    this.editingMessageId = message.id;
    this.showEditModal = true;
    this.cdr.markForCheck();
  }

  cancelEdit() {
    this.showEditModal = false;
    this.editedMessage = '';
    this.editingMessageId = null;
    this.cdr.markForCheck();
  }

  saveEdit() {
    if (!this.editingMessageId || !this.editedMessage.trim()) return;
    const updatedContent = this.editedMessage.trim();

    this.convos.editMessage(this.editingMessageId, updatedContent).subscribe({
      next: (res) => {
        const idx = this.messages.findIndex(
          (m) => m.id === this.editingMessageId
        );
        if (idx > 1) this.messages[idx] = { ...res };
        this.cancelEdit();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Edit failed', err);
        this.cancelEdit();
      },
    });
  }

  // open delete Modal
  openDeleteModal(message: ConversationMessage) {
    if (message.senderId.toString() !== this.myId) return; // Fix this check
    this.closeAllMenus();
    this.messageToDelete = message;
    this.showDeleteModal = true;
    this.cdr.markForCheck();
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.messageToDelete = null;
    this.cdr.markForCheck();
  }

  confirmDelete() {
    if (!this.messageToDelete) return;
    this.convos.deleteMessage(this.messageToDelete.id).subscribe({
      next: () => {
        this.messages = this.messages.filter(
          (m) => m.id !== this.messageToDelete?.id
        );
        this.showDeleteModal = false;
        this.messageToDelete = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Delete Failde');
        this.cancelDelete();
      },
    });
  }

  // reply
  replyToMessage(message: ConversationMessage) {
    this.replyingTo = message;
  }

  cancelreply() {
    this.replyingTo = null;
  }

  isMenuOpen(id: string): boolean {
    return !!this.menuOpen[id];
  }
  
  closeMenu(id?: string) {
    if (id) {
      this.menuOpen[id] = false;
    } else {
      this.menuOpen = {};
    }
    this.cdr.markForCheck();
  }
  
  // Close menus when clicking outside
@HostListener('document:click', ['$event'])
onDocumentClick(event: Event) {
  const target = event.target as HTMLElement;

  // Check if click is inside a menu or its button
  const clickedInsideMenu = target.closest('.dm-menu, .dm-menu-btn');

  if (!clickedInsideMenu) {
    this.closeAllMenus();
  }
}


}
