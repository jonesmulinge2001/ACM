import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit
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

  constructor(
    private socket: SocketService,
    private groups: GroupsService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.currentUserId = this.auth.getUserId();
    this.socket.connect();
    this.socket.join(this.groupId);

    this.loadMessages();

    this.subs.add(this.socket.onMessage().subscribe((m) => {
      if (m.groupId === this.groupId) {
        this.messages.push(m);
        if (this.isNearBottom()) {
          this.scrollToBottom();
        } else {
          this.showNewMessageButton = true;
        }
      }
    }));
  }

  ngAfterViewInit() {
    this.messagesContainer.nativeElement.addEventListener('scroll', () => {
      if (this.isNearBottom()) {
        this.showNewMessageButton = false;
      }
    });

    setTimeout(() => this.scrollToBottom(), 100);
  }

  loadMessages() {
    this.groups.getMessages(this.groupId).subscribe(msgs => {
      this.messages = msgs.reverse();
      this.scrollToBottom();
    });
  }

  send() {
    const content = this.messageControl.value?.trim();
    if (!content) return;
    this.socket.sendMessage(this.groupId, content);
    this.messageControl.reset();
    this.scrollToBottom();
  }

  private scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
      this.showNewMessageButton = false;
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
}
