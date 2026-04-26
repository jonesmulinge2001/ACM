import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationItem } from '../../interfaces';
import { NotificationService } from '../../services/notification.service';


@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications.component.html',
})
export class NotificationComponent implements OnInit, OnDestroy {
  @ViewChild('notificationMenu') notificationMenu!: ElementRef;
  @ViewChild('notificationList') notificationList!: ElementRef;

  notifications: NotificationItem[] = [];
  unreadCount: number = 0;
  menuOpen: boolean = false;
  loading: boolean = false;
  loadingMore: boolean = false;
  markingAllAsRead: boolean = false;
  markingAsRead: Record<string, boolean> = {};

  activePreviewId: string | null = null;

  private subscriptions = new Subscription();
  private clickListener!: (event: MouseEvent) => void;


  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(
        notifications => (this.notifications = notifications)
      )
    );

    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe(
        count => (this.unreadCount = count)
      )
    );

    this.loadNotifications();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.removeOutsideClickListener();
  }

  // ── Menu ────────────────────────────────────────────────────

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      setTimeout(() => {
        this.setupOutsideClickListener();
        this.loadNotifications();
      });
    }
  }

  closeMenu(): void {
    this.menuOpen = false;
    this.removeOutsideClickListener();
  }

  private setupOutsideClickListener(): void {
    setTimeout(() => {
      this.clickListener = (event: MouseEvent) => {
        const menu = this.notificationMenu?.nativeElement;
        const target = event.target as Element;
        if (menu && !menu.contains(target) && !target.closest('.notification-trigger')) {
          this.closeMenu();
        }
      };
      document.addEventListener('click', this.clickListener);
    });
  }

  private removeOutsideClickListener(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }

  // ── Data ────────────────────────────────────────────────────

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.fetchNotifications(false);
    setTimeout(() => (this.loading = false), 300);
    this.cdr.detectChanges();
  }

  refresh(): void {
    this.loading = true;
    this.notificationService.fetchNotifications(false);
    setTimeout(() => (this.loading = false), 500);
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const nearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
    if (nearBottom && !this.loadingMore && this.menuOpen) {
      this.loadMoreNotifications();
    }
  }

  private loadMoreNotifications(): void {
    this.loadingMore = true;
    this.notificationService.fetchNotifications(true);
    setTimeout(() => (this.loadingMore = false), 1000);
  }

  // ── Actions ─────────────────────────────────────────────────

  handleNotificationClick(notification: NotificationItem, event: Event): void {
    event.stopPropagation();
    if (!notification.seen) {
      this.markAsRead(notification.id, event);
    }
    this.navigateToContent(notification);
    this.closeMenu();
  }

  navigateToContent(notification: NotificationItem): void {
    this.router.navigateByUrl(notification.actionUrl ?? '/notifications');
  }

  markAsRead(notificationId: string, event: Event): void {
    event.stopPropagation();
    this.markingAsRead[notificationId] = true;
    this.notificationService.markAsSeen(notificationId).subscribe({
      next: () => delete this.markingAsRead[notificationId],
      error: () => delete this.markingAsRead[notificationId],
    });
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.markingAllAsRead = true;
    this.notificationService.markAllAsSeen().subscribe({
      next: () => (this.markingAllAsRead = false),
      error: () => (this.markingAllAsRead = false),
    });
  }

  // ── Helpers ─────────────────────────────────────────────────

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      POST_LIKED:    'thumb_up',
      POST_COMMENTED:'comment',
      FOLLOWED:      'person_add',
      MESSAGE_SENT:  'message',
    };
    return icons[type] ?? 'notifications';
  }

  getIconBgClass(type: string): string {
    const map: Record<string, string> = {
      POST_LIKED:    'bg-red-50',
      POST_COMMENTED:'bg-orange-50',
      FOLLOWED:      'bg-green-50',
      MESSAGE_SENT:  'bg-blue-50',
    };
    return map[type] ?? 'bg-gray-100';
  }

  getIconColorClass(type: string): string {
    const map: Record<string, string> = {
      POST_LIKED:    'text-red-500',
      POST_COMMENTED:'text-orange-500',
      FOLLOWED:      'text-green-600',
      MESSAGE_SENT:  'text-blue-500',
    };
    return map[type] ?? 'text-gray-500';
  }

  formatTime(timestamp: string): string {
    const diffMs   = Date.now() - new Date(timestamp).getTime();
    const mins     = Math.floor(diffMs / 60_000);
    const hours    = Math.floor(diffMs / 3_600_000);
    const days     = Math.floor(diffMs / 86_400_000);

    if (mins  <  1) return 'Just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days  <  7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });
  }

  // preview for profileImages in the notifications
  togglePreview(notificationId: string, event: Event): void {
    event.stopPropagation();
    this.activePreviewId =
      this.activePreviewId === notificationId ? null : notificationId;

      this.cdr.detectChanges();
  }
}