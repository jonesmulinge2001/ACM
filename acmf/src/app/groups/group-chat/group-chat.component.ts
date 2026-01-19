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

interface Attachment {
  file: File;
  previewUrl?: string | null;
  uploading?: boolean;
  progress?: number;
  fileType: 'IMAGE' | 'VIDEO' | 'FILE';
}

interface GroupMessageUI extends GroupMessage {
  uploading?: boolean; // is the file currently uploading?
  progress?: number; // upload progress percentage (0..100)
  mediaType?: 'image' | 'video' | 'file';
  mediaUrl?: string;   // for preview
  attachments?: {
    fileName: string;
    fileType: 'IMAGE' | 'VIDEO' | 'FILE';
    previewUrl?: string | null;
    progress?: number;
  }[];
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
  @ViewChild('messagesContainer')
  private messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef<HTMLInputElement>;

  messages: GroupMessageUI[] = [];
  subs = new Subscription();
  messageControl = new FormControl('');
  showNewMessageButton = false;

  currentUserId: string | null = null;
  menuOpen: Record<string, boolean> = {};

  // Delete modal
  showDeleteModal: boolean = false;
  messageToDelete: GroupMessage | null = null;

  // Edit modal
  showEditModal = false;
  editedMessage: string = '';
  editingMessageId: string | null = null;

  // Reply
  replyingTo: GroupMessage | null = null;

  // Attachments
  pendingAttachments: Attachment[] = [];

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

    // Revoke any object URLs from attachments
    this.pendingAttachments.forEach((att) => {
      if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
    });
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
    if (!this.fileInput || !this.fileInput.nativeElement) {
      console.warn('File input not ready');
      return;
    }
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }
  

  /** file selected (from hidden input) */
  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
  
    const newFiles: Attachment[] = Array.from(input.files).map((file) => {
      let type: 'IMAGE' | 'VIDEO' | 'FILE' = 'FILE';
      let previewUrl: string | null = null;
  
      if (file.type.startsWith('image/')) {
        type = 'IMAGE';
        previewUrl = URL.createObjectURL(file);
      } else if (file.type.startsWith('video/')) {
        type = 'VIDEO';
        previewUrl = URL.createObjectURL(file);
      }
  
      return {
        file,
        previewUrl,
        fileType: type,
        uploading: false,
        progress: 0,
      };
    });
  
    this.pendingAttachments.push(...newFiles);
    this.cdr.markForCheck();
  }
  

  /** Cancel all pending attachments (before sending) */
  cancelAllAttachments() {
    this.pendingAttachments.forEach(att => {
      if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
    });
    this.pendingAttachments = [];
    this.cdr.markForCheck();
  }

  async send(): Promise<void> {
    const content = this.messageControl.value?.trim() || '';
    if (!content && this.pendingAttachments.length === 0) return;
  
    const attachments = [...this.pendingAttachments];
    const files = attachments.map(a => a.file);
  
    // ------------------ OPTIMISTIC MESSAGE ------------------
    const tempMsg: GroupMessageUI = {
      id: 'temp-' + Date.now(),
      groupId: this.groupId,
      content,
      userId: this.currentUserId ?? '',
      createdAt: new Date().toISOString(),
      user: {
        id: this.currentUserId ?? '',
        name: 'Me',
        profileImage: this.auth.getCurrentuser()?.profileImage ?? null,
      },
      uploading: attachments.length ? true : undefined,
      progress: 0,
      mediaType: undefined, // optional, not needed if multiple attachments
      mediaUrl: undefined,
      replyTo: this.replyingTo || undefined,
      attachments: attachments.map(a => ({
        fileName: a.file.name,
        fileType: a.fileType,
        previewUrl: a.previewUrl,
        progress: 0
      }))
    };
    
  
    this.messages.push(tempMsg);
    this.scrollToBottom();
    this.cdr.markForCheck();
  
    // ------------------ SEND VIA SERVICE WITH PROGRESS ------------------
    this.groups.sendMessage(this.groupId, content, files, this.replyingTo?.id, (progress) => {
      tempMsg.attachments?.forEach(a => a.progress = progress);
      this.cdr.markForCheck();
    }).subscribe({
      next: (saved) => {
        // Replace optimistic message with saved message
        const idx = this.messages.findIndex(m => m.id === tempMsg.id);
        if (idx > -1) this.messages[idx] = saved;
  
        // Cleanup
        this.pendingAttachments.forEach(a => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
        this.pendingAttachments = [];
        this.messageControl.reset();
        this.replyingTo = null;
  
        this.scrollToBottom();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[GroupChat] sendMessage error', err);
        this.messages = this.messages.filter(m => m.id !== tempMsg.id);
        this.cdr.markForCheck();
      }
    });
  
    // ------------------ SEND VIA SOCKET IF NO ATTACHMENTS ------------------
    if (attachments.length === 0) {
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
        const idx = this.messages.findIndex(
          (m) => m.id === this.editingMessageId
        );
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
        this.messages = this.messages.filter(
          (m) => m.id !== this.messageToDelete?.id
        );
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

  removeAttachment(index: number) {
    const att = this.pendingAttachments[index];
    if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
    this.pendingAttachments.splice(index, 1);
    this.cdr.markForCheck();
  }
}
