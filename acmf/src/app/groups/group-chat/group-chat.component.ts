import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GroupMessage } from '../../interfaces';
import { GroupsService } from '../../services/group.service';
import { SocketService } from '../../services/socket.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

type Attachment = {
  file: File;
  previewUrl?: string | null; // for image preview (object URL)
  uploading?: boolean;
  progress?: number;
  fileType: 'IMAGE' |'VIDEO'| 'FILE';
};

interface GroupMessageUI extends GroupMessage {
  uploading?: boolean;   // is the file currently uploading?
  progress?: number;     // upload progress percentage (0..100)
  mediaType?: 'image' | 'video' | 'file';
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  selector: 'app-group-chat',
  templateUrl: './group-chat.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() groupId!: string;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  messages: GroupMessageUI[] = [];
  subs = new Subscription();
  messageControl = new FormControl('');
  showNewMessageButton = false;

  currentUserId: string | null = null;
  menuOpen: Record<string, boolean> = {};

  // Delete modal
  showDeleteModal = false;
  messageToDelete: GroupMessage | null = null;

  // Edit modal
  showEditModal = false;
  editedMessage = '';
  editingMessageId: string | null = null;

  // Reply
  replyingTo: GroupMessage | null = null;

  // Attachments
  pendingAttachment: Attachment | null = null;

  

  constructor(
    private socket: SocketService,
    private groups: GroupsService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  // ------------------ LIFECYCLE ------------------
  ngOnInit() {
    this.currentUserId = this.auth.getUserId();
    this.socket.connect();
    this.socket.join(this.groupId);
    this.loadMessages();

    // Real-time message listener
    this.subs.add(
      this.socket.onMessage().subscribe((m) => {
        if (m.groupId === this.groupId) {
          // avoid duplicates
          if (!this.messages.some((msg) => msg.id === m.id)) {
            this.messages.push(m);
            this.cdr.markForCheck();
            if (this.isNearBottom()) this.scrollToBottom();
            else this.showNewMessageButton = true;
          }
        }
      })
    );
  }

  ngAfterViewInit() {
    this.messagesContainer.nativeElement.addEventListener('scroll', () => {
      if (this.isNearBottom()) {
        this.showNewMessageButton = false;
        this.cdr.markForCheck();
      }
    });

    setTimeout(() => this.scrollToBottom(), 100);
  }

  ngOnDestroy() {
    this.socket.leave(this.groupId);
    this.subs.unsubscribe();
    // revoke object URL if any
    if (this.pendingAttachment?.previewUrl) URL.revokeObjectURL(this.pendingAttachment.previewUrl);
  }

  // ------------------ MESSAGES ------------------
  loadMessages() {
    this.groups.getMessages(this.groupId).subscribe((msgs) => {
      // backend returns newest last? your earlier code reversed; keep same behavior
      this.messages = msgs.reverse();
      this.scrollToBottom();
      this.cdr.markForCheck();
    });
  }

  /** Determine file type using MIME */
  private detectFileType(file: File): 'IMAGE' | 'VIDEO' | 'FILE' {
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type.startsWith('video/')) return 'VIDEO';
    return 'FILE';
  }
  

  /** Trigger file input (attach button) */
  openFilePicker() {
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  /** file selected (from hidden input) */
  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;

    // validate size? you can mirror server limits if desired
    // create preview for images
    const fileType = this.detectFileType(file);
    const previewUrl = fileType === 'IMAGE' ? URL.createObjectURL(file) : null;

    // replace any existing pending attachment (revoke url)
    if (this.pendingAttachment?.previewUrl) URL.revokeObjectURL(this.pendingAttachment.previewUrl);

    this.pendingAttachment = {
      file,
      previewUrl,
      uploading: false,
      progress: 0,
      fileType,
    };

    this.cdr.markForCheck();
  }

  /** Cancel pending attachment (before sending) */
  cancelAttachment() {
    if (this.pendingAttachment?.previewUrl) URL.revokeObjectURL(this.pendingAttachment.previewUrl);
    this.pendingAttachment = null;
    this.cdr.markForCheck();
  }

  async send(): Promise<void> {
    const content: string = this.messageControl.value?.trim() || '';
  
    const attach = this.pendingAttachment;
  
    // If nothing to send, exit
    if (!content && !attach) return;
  
    // Build optimistic message
    const optimistic: GroupMessageUI = {
      id: 'temp-' + Date.now(),
      content: content || '',
      groupId: this.groupId,
      userId: this.currentUserId ?? '',
      createdAt: new Date().toISOString(),
      user: {
        id: this.currentUserId ?? '',
        name: 'Me',
        profileImage: this.auth.getCurrentuser()?.profileImage ?? null,
      },
      replyTo: this.replyingTo || undefined,
      mediaUrl: attach?.previewUrl ?? undefined,
      mediaType: attach ? (attach.fileType.toLowerCase() as 'image' | 'video' | 'file') : undefined,
      uploading: attach ? true : undefined,
      progress: attach ? 0 : undefined,
    };
  
    this.messages.push(optimistic);
    this.scrollToBottom();
    this.cdr.markForCheck();
  
    // Prepare file if exists
    let file: File | undefined;
    let fileType: 'IMAGE' | 'VIDEO' | 'FILE' | undefined;
    if (attach) {
      file = attach.file;
      fileType = attach.fileType;
    }
  
    // Send via unified service
    this.groups
      .sendMessage(this.groupId, content, file, fileType, this.replyingTo?.id, attach ? (p) => {
        attach.progress = p;
        this.cdr.markForCheck();
      } : undefined)
      .subscribe({
        next: (saved) => {
          const idx = this.messages.findIndex((m) => m.id === optimistic.id);
          if (idx > -1) this.messages[idx] = saved;
  
          if (attach?.previewUrl) URL.revokeObjectURL(attach.previewUrl);
          this.pendingAttachment = null;
          this.messageControl.reset();
          this.replyingTo = null;
          this.cdr.markForCheck();
          this.scrollToBottom();
        },
        error: (err) => {
          console.error('Send failed', err);
          this.messages = this.messages.filter((m) => m.id !== optimistic.id);
  
          if (attach) {
            attach.uploading = false;
            attach.progress = 0;
          }
  
          this.cdr.markForCheck();
        },
      });
  
    // Emit via socket if only text
    if (!attach) {
      this.socket.sendMessage(this.groupId, content, this.replyingTo?.id ?? null);
    }
  
    this.replyingTo = null;
  }
  

  // ------------------ SCROLL & UI ------------------
  private scrollToBottom() {
    setTimeout(() => {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.showNewMessageButton = false;
      this.cdr.markForCheck();
    }, 50);
  }

  private isNearBottom(): boolean {
    const el = this.messagesContainer.nativeElement;
    const threshold = 100;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }

  jumpToBottom() {
    this.scrollToBottom();
  }

  isMyMessage(m: GroupMessage): boolean {
    return m.userId === this.currentUserId;
  }

  // ------------------ MENU HANDLERS ------------------
  toggleMenu(id: string) {
    this.menuOpen[id] = !this.menuOpen[id];
    this.cdr.markForCheck();
  }

  closeAllMenus() {
    this.menuOpen = {};
    this.cdr.markForCheck();
  }

  // ------------------ EDIT MODAL ------------------
  openEditModal(message: GroupMessage) {
    if (!this.isMyMessage(message)) return;
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

    this.groups.editMessage(this.editingMessageId, updatedContent).subscribe({
      next: (res) => {
        const idx = this.messages.findIndex((m) => m.id === this.editingMessageId);
        if (idx > -1) this.messages[idx] = { ...res };
        this.cancelEdit();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Edit failed', err);
        this.cancelEdit();
      },
    });
  }

  // ------------------ DELETE MODAL ------------------
  openDeleteModal(message: GroupMessage) {
    if (!this.isMyMessage(message)) return;
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

    this.groups.deleteMessage(this.messageToDelete.id).subscribe({
      next: () => {
        this.messages = this.messages.filter((m) => m.id !== this.messageToDelete?.id);
        this.showDeleteModal = false;
        this.messageToDelete = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.cancelDelete();
      },
    });
  }

  // ------------------ REPLY ------------------
  replyToMessage(message: GroupMessage) {
    this.replyingTo = message;
  }

  cancelReply() {
    this.replyingTo = null;
  }

  // Utility to open attachments in new tab
  openAttachment(url?: string | null) {
    if (!url) return;
    window.open(url, '_blank');
  }
}
