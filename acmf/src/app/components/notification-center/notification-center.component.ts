import {
  Component,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StudentNotificationService } from '../../services/student-notification.service';
import { NotificationSocketService } from '../../services/notification-socket.service';
import { StudentNotification } from '../../interfaces';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-center.component.html',
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  notifications: StudentNotification[] = [];
  unreadCount = 0;
  private socketSub?: Subscription;

  panelOpen = false;

  @Output() markAllAsReadEvent = new EventEmitter<void>();

  constructor(
    private notifService: StudentNotificationService,
    private notifSocket: NotificationSocketService,
    private router: Router
  ) {}

  ngOnInit() {
    // 1. Fetch stored notifications (REST)
    this.reloadNotifications();

    // 2. Listen for real-time new ones (WebSocket)
    this.socketSub = this.notifSocket.onNewNotification().subscribe((notif) => {
      this.notifications.unshift(notif);
      if (notif.status === 'UNREAD') {
        this.unreadCount++;
      }
    });
  }

  /** Toggle the dropdown panel */
  togglePanel() {
    this.panelOpen = !this.panelOpen;
  }

  ngOnDestroy() {
    this.socketSub?.unsubscribe();
  }

  openNotification(n: StudentNotification) {
    if (n.status === 'UNREAD') {
      this.markAsReadLocal(n.id);
      this.notifService.markAsRead(n.id).subscribe({
        error: (err) => {
          console.error('Failed to mark as read', err);
          this.reloadNotifications();
        },
      });
    }

    if (n.type === 'ANNOUNCEMENT' && n.referenceId) {
      this.router.navigate(['/announcements', n.referenceId]);
      this.panelOpen = false;
    } else {
      console.log('Clicked notification', n);
    }
  }

  markAllAsRead() {
    const unread = this.notifications.filter((n) => n.status === 'UNREAD');
    if (unread.length === 0) return;

    unread.forEach((n) => this.markAsReadLocal(n.id));

    const calls = unread.map((n) =>
      this.notifService.markAsRead(n.id).pipe(
        catchError((err) => {
          console.error('error marking one as read', err);
          return of(null);
        })
      )
    );

    forkJoin(calls).subscribe(() => {
      this.reloadNotifications();
      this.markAllAsReadEvent.emit(); // tell navbar to reset badge
    });
  }

  private reloadNotifications() {
    this.notifService.getNotifications().subscribe({
      next: (list) => {
        this.notifications = (list || []).sort((a, b) => {
          if (a.status === b.status) {
            return +new Date(b.createdAt) - +new Date(a.createdAt);
          }
          return a.status === 'UNREAD' ? -1 : 1;
        });
        this.unreadCount = this.notifications.filter(
          (n) => n.status === 'UNREAD'
        ).length;
      },
      error: (err) => console.error('Failed reloading notifications', err),
    });
  }

  private markAsReadLocal(notificationId: string) {
    const idx = this.notifications.findIndex((n) => n.id === notificationId);
    if (idx >= 0 && this.notifications[idx].status === 'UNREAD') {
      this.notifications[idx].status = 'READ';
      this.notifications[idx].readAt = new Date().toISOString();
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    }
  }

  timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const d = Math.floor(hr / 24);
    return `${d}d`;
  }
}
