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
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  messages: GroupMessage[] = [];
  subs = new Subscription();
  messageControl = new FormControl('');
  showNewMessageButton = false;

  currentUserId: string | null = null;
  menuOpen: Record<string, boolean> = {};

  // 🗑️ Delete modal
  showDeleteModal = false;
  messageToDelete: GroupMessage | null = null;

  // ✏️ Edit modal
  showEditModal = false;
  editedMessage = '';
  editingMessageId: string | null = null;

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

    this.subs.add(
      this.socket.onMessage().subscribe((m) => {
        if (m.groupId === this.groupId) {
          this.messages.push(m);
          this.cdr.markForCheck();
          if (this.isNearBottom()) this.scrollToBottom();
          else this.showNewMessageButton = true;
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
  }

  // ------------------ MESSAGES ------------------
  loadMessages() {
    this.groups.getMessages(this.groupId).subscribe((msgs) => {
      this.messages = msgs.reverse();
      this.scrollToBottom();
      this.cdr.markForCheck();
    });
  }

  send() {
    const content = this.messageControl.value?.trim();
    if (!content) return;

    this.socket.sendMessage(this.groupId, content);

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
    this.cdr.markForCheck();
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
}
