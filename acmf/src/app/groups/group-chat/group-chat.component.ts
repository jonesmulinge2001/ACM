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

  messages: GroupMessage[] = [];
  subs = new Subscription();
  messageControl = new FormControl('');

  showNewMessageButton = false;
  currentUserId: string | null = null;

  // Track which message is being edited
  editingMessageId: string | null = null;
  editControl = new FormControl('');

  menuOpen: Record<string, boolean> = {};

  showDeleteModal = false;
  messageToDelete: GroupMessage | null = null;

  constructor(
    private socket: SocketService,
    private groups: GroupsService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef // ✅ inject ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.currentUserId = this.auth.getUserId();
    this.socket.connect();
    this.socket.join(this.groupId);

    this.loadMessages();

    this.subs.add(
      this.socket.onMessage().subscribe((m) => {
        if (m.groupId === this.groupId) {
          this.messages.push(m);
          this.cdr.markForCheck(); // ✅ trigger UI refresh
          if (this.isNearBottom()) {
            this.scrollToBottom();
          } else {
            this.showNewMessageButton = true;
          }
        }
      })
    );
  }

  ngAfterViewInit() {
    this.messagesContainer.nativeElement.addEventListener('scroll', () => {
      if (this.isNearBottom()) {
        this.showNewMessageButton = false;
        this.cdr.markForCheck(); // update when scroll changes state
      }
    });

    setTimeout(() => this.scrollToBottom(), 100);
  }

  loadMessages() {
    this.groups.getMessages(this.groupId).subscribe((msgs) => {
      this.messages = msgs.reverse();
      this.scrollToBottom();
      this.cdr.markForCheck(); // ✅ refresh after loading
    });
  }

  send() {
    const content = this.messageControl.value?.trim();
    if (!content) return;

    this.socket.sendMessage(this.groupId, content);

    // optimistic update
    const optimistic: GroupMessage = {
      id: 'temp-' + Date.now(),
      content,
      groupId: this.groupId,
      userId: this.currentUserId ?? '',
      createdAt: new Date().toISOString(),
      user: {
        id: this.currentUserId ?? '',
        name: 'Me',
        profileImage: this.auth.getCurrentuser()?.profileImage ?? null,
      },
    };
    this.messages.push(optimistic);
    this.messageControl.reset();
    this.scrollToBottom();
    this.cdr.markForCheck(); // ✅ refresh after sending
  }

  private scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
      this.showNewMessageButton = false;
      this.cdr.markForCheck(); // ✅ refresh after scrolling
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

  ngOnDestroy() {
    this.socket.leave(this.groupId);
    this.subs.unsubscribe();
  }
  // ✏️ Start editing
  startEditing(message: GroupMessage) {
    if (!this.isMyMessage(message)) return;
    this.editingMessageId = message.id;
    this.editControl.setValue(message.content);
    this.cdr.markForCheck();
  }

  // 🚫 Cancel editing
  cancelEditing() {
    this.editingMessageId = null;
    this.editControl.reset();
    this.cdr.markForCheck();
  }

  // 💾 Save edited message
  saveEdit(message: GroupMessage) {
    const updated = this.editControl.value?.trim();
    if (!updated || updated === message.content) {
      this.cancelEditing();
      return;
    }

    this.groups.editMessage(message.id, updated).subscribe({
      next: (res) => {
        const idx = this.messages.findIndex((m) => m.id === message.id);
        if (idx > -1) this.messages[idx] = { ...res };
        this.cancelEditing();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Edit failed', err);
        this.cancelEditing();
      },
    });
  }

  // 🗑️ Delete message
  deleteMessage(message: GroupMessage) {
    if (!this.isMyMessage(message)) return;
    if (!confirm('Delete this message?')) return;

    this.groups.deleteMessage(message.id).subscribe({
      next: () => {
        this.messages = this.messages.filter((m) => m.id !== message.id);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Delete failed', err),
    });
  }

  toggleMenu(id: string) {
    this.menuOpen[id] = !this.menuOpen[id];
    this.cdr.markForCheck();
  }

  closeMenus() {
    this.menuOpen = {};
    this.cdr.markForCheck();
  }

  // 🗑️ Trigger modal
  openDeleteModal(message: GroupMessage) {
    if (!this.isMyMessage(message)) return;
    this.messageToDelete = message;
    this.showDeleteModal = true;
    this.cdr.markForCheck();
  }

  // ❌ Cancel modal
  cancelDelete() {
    this.showDeleteModal = false;
    this.messageToDelete = null;
    this.cdr.markForCheck();
  }

  // ✅ Confirm deletion
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

}
