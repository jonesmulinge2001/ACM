// notification.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationItem } from '../../interfaces';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  template: `
    <div class="notification-container">
      <button
        class="notification-button"
        (click)="toggleMenu()"
        [class.menu-open]="menuOpen"
        [attr.data-badge]="unreadCount > 0 ? unreadCount : null"
      >
        <span class="material-icons">notifications</span>
      </button>

      <div class="notification-menu" *ngIf="menuOpen" #notificationMenu>
        <div class="notification-header">
          <h3>Notifications</h3>
          <div class="header-actions">
            <button
              class="action-button"
              *ngIf="unreadCount > 0"
              (click)="markAllAsRead($event)"
              [disabled]="markingAllAsRead"
            >
              <span class="material-icons">done_all</span>
              Mark all as read
            </button>
            <button 
              class="icon-button" 
              (click)="refresh()" 
              [disabled]="loading"
              [class.rotating]="loading"
            >
              <span class="material-icons">refresh</span>
            </button>
            <button class="icon-button close-button" (click)="closeMenu()">
              <span class="material-icons">close</span>
            </button>
          </div>
        </div>

        <div class="notification-list" #notificationList (scroll)="onScroll($event)">
          <ng-container *ngIf="notifications.length > 0; else noNotifications">
            <div
              *ngFor="let notification of notifications"
              class="notification-item"
              [class.unread]="!notification.seen"
              (click)="handleNotificationClick(notification, $event)"
            >
              <div class="notification-icon">
                <span 
                  class="material-icons" 
                  [ngClass]="getNotificationIconClass(notification.type)"
                >
                  {{ getNotificationIcon(notification.type) }}
                </span>
              </div>
              <div class="notification-content">
                <p class="notification-message">{{ notification.message }}</p>
                <div class="notification-meta">
                  <span class="timestamp">{{ formatTime(notification.createdAt) }}</span>
                  <span class="count-badge" *ngIf="notification.count > 1">
                    +{{ notification.count - 1 }}
                  </span>
                </div>
                <div class="notification-actors" *ngIf="notification.actorNames.length > 0">
                  <span class="actor-name">{{ notification.actorNames[0] }}</span>
                  <span *ngIf="notification.actorNames.length > 1" class="actor-more">
                    and {{ notification.count - 1 }} other{{ notification.count > 2 ? 's' : '' }}
                  </span>
                </div>
              </div>
              <div class="notification-actions">
                <button
                  *ngIf="!notification.seen"
                  class="icon-button small"
                  (click)="markAsRead(notification.id, $event)"
                  [disabled]="markingAsRead[notification.id]"
                >
                  <span class="material-icons">check_circle</span>
                </button>
              </div>
            </div>

            <div *ngIf="loadingMore" class="loading-more">
              <div class="spinner"></div>
              <span>Loading more...</span>
            </div>
          </ng-container>

          <ng-template #noNotifications>
            <div class="empty-state">
              <span class="material-icons empty-icon">notifications_off</span>
              <p>No notifications yet</p>
              <p class="empty-subtext">When you get notifications, they'll appear here</p>
            </div>
          </ng-template>
        </div>

        <div class="notification-footer">
          <button class="footer-button" routerLink="/notifications" (click)="closeMenu()">
            <span class="material-icons">list</span>
            View all notifications
          </button>
        </div>
      </div>

      <!-- Backdrop for mobile -->
      <div class="menu-backdrop" *ngIf="menuOpen" (click)="closeMenu()"></div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: relative;
      display: inline-block;
    }

    .notification-button {
      position: relative;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
      color: #5f6368;
    }

    .notification-button:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .notification-button.menu-open {
      background-color: rgba(0, 0, 0, 0.08);
    }

    .notification-button[data-badge]::after {
      content: attr(data-badge);
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 18px;
      height: 18px;
      background: #d23f31;
      color: white;
      font-size: 11px;
      font-weight: 500;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    .material-icons {
      font-family: 'Material Icons';
      font-weight: normal;
      font-style: normal;
      font-size: 24px;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -webkit-font-feature-settings: 'liga';
      -webkit-font-smoothing: antialiased;
    }

    .notification-menu {
      position: absolute;
      top: 100%;
      right: 0;
      width: 400px;
      max-height: 80vh;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    @media (max-width: 480px) {
      .notification-menu {
        position: fixed;
        top: 60px;
        left: 16px;
        right: 16px;
        width: auto;
        max-height: calc(100vh - 80px);
      }
    }

    .notification-header {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fafafa;
      flex-shrink: 0;
    }

    .notification-header h3 {
      margin: 0;
      font-weight: 500;
      color: #202124;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .action-button {
      background: none;
      border: none;
      color: #1976d2;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      padding: 6px 8px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: background-color 0.2s;
    }

    .action-button:hover:not(:disabled) {
      background-color: rgba(25, 118, 210, 0.08);
    }

    .action-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .icon-button {
      background: none;
      border: none;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
      color: #5f6368;
    }

    .icon-button:hover:not(:disabled) {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .icon-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .icon-button.small {
      width: 24px;
      height: 24px;
    }

    .icon-button.small .material-icons {
      font-size: 18px;
    }

    .close-button {
      display: none;
    }

    @media (max-width: 480px) {
      .close-button {
        display: flex;
      }
    }

    .rotating {
      animation: rotate 1s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .notification-list {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      max-height: 500px;
    }

    @media (max-width: 480px) {
      .notification-list {
        max-height: none;
      }
    }

    .notification-item {
      display: flex;
      padding: 12px 16px;
      gap: 12px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s;
      position: relative;
    }

    .notification-item:hover {
      background-color: #f8f9fa;
    }

    .notification-item.unread {
      background-color: #f0f7ff;
    }

    .notification-item.unread:hover {
      background-color: #e8f0fe;
    }

    .notification-item.unread::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: #1976d2;
    }

    .notification-icon {
      flex-shrink: 0;
    }

    .notification-icon .material-icons {
      width: 40px;
      height: 40px;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #f5f5f5;
      color: #666;
    }

    .notification-icon .post-liked {
      color: #ff5252;
      background: #ffebee;
    }

    .notification-icon .post-commented {
      color: #ff9800;
      background: #fff3e0;
    }

    .notification-icon .followed {
      color: #4caf50;
      background: #e8f5e9;
    }

    .notification-icon .message-sent {
      color: #2196f3;
      background: #e3f2fd;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-message {
      margin: 0 0 4px 0;
      font-size: 14px;
      line-height: 1.4;
      color: #202124;
      font-weight: 500;
    }

    .notification-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .timestamp {
      font-size: 12px;
      color: #5f6368;
    }

    .count-badge {
      font-size: 11px;
      padding: 2px 6px;
      background: #e0e0e0;
      border-radius: 10px;
      color: #5f6368;
    }

    .notification-actors {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #5f6368;
    }

    .actor-name {
      font-weight: 500;
      color: #3c4043;
    }

    .actor-more {
      color: #5f6368;
    }

    .notification-actions {
      display: flex;
      align-items: flex-start;
    }

    .loading-more {
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: #5f6368;
      font-size: 12px;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      padding: 48px 24px;
      text-align: center;
      color: #5f6368;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: #dadce0;
    }

    .empty-state p {
      margin: 0;
    }

    .empty-subtext {
      font-size: 12px;
      margin-top: 4px;
      color: #9aa0a6;
    }

    .notification-footer {
      padding: 12px 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: center;
      background: #fafafa;
      flex-shrink: 0;
    }

    .footer-button {
      background: none;
      border: none;
      color: #1976d2;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: background-color 0.2s;
    }

    .footer-button:hover {
      background-color: rgba(25, 118, 210, 0.08);
    }

    .menu-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      background: transparent;
    }

    @media (max-width: 480px) {
      .menu-backdrop {
        background: rgba(0, 0, 0, 0.5);
      }
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  @ViewChild('notificationMenu') notificationMenu!: ElementRef;
  @ViewChild('notificationList') notificationList!: ElementRef;

  notifications: NotificationItem[] = [];
  unreadCount = 0;
  menuOpen = false;
  loading = false;
  loadingMore = false;
  markingAllAsRead = false;
  markingAsRead: { [key: string]: boolean } = {};

  private subscriptions = new Subscription();
  private clickListener!: (event: MouseEvent) => void;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  

  ngOnInit() {
    // Subscribe to notifications
    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(
        notifications => {
          this.notifications = notifications;
        }
      )
    );

    // Subscribe to unread count
    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe(
        count => {
          this.unreadCount = count;
        }
      )
    );

    // Load notifications when component initializes
    this.loadNotifications();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      setTimeout(() => {
        this.setupOutsideClickListener();
        this.loadNotifications();
      });
    }
  }

  closeMenu() {
    this.menuOpen = false;
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }

  private setupOutsideClickListener() {
    setTimeout(() => {
      this.clickListener = (event: MouseEvent) => {
        if (this.notificationMenu && 
            this.notificationMenu.nativeElement && 
            !this.notificationMenu.nativeElement.contains(event.target) &&
            !(event.target as Element).closest('.notification-button')) {
          this.closeMenu();
        }
      };
      document.addEventListener('click', this.clickListener);
    });
  }

  loadNotifications() {
    this.loading = true;
    this.notificationService.fetchNotifications(false);
    
    setTimeout(() => {
      this.loading = false;
    }, 300);
  }

  refresh() {
    this.loading = true;
    this.notificationService.fetchNotifications(false);
    setTimeout(() => {
      this.loading = false;
    }, 500);
  }

  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

    if (atBottom && !this.loadingMore && this.menuOpen) {
      this.loadMoreNotifications();
    }
  }

  loadMoreNotifications() {
    this.loadingMore = true;
    this.notificationService.fetchNotifications(true);
    
    setTimeout(() => {
      this.loadingMore = false;
    }, 1000);
  }

  handleNotificationClick(notification: NotificationItem, event: Event) {
    event.stopPropagation();
    
    if (!notification.seen) {
      this.markAsRead(notification.id, event);
    }

    this.navigateToContent(notification);
    this.closeMenu();
  }

  navigateToContent(notification: NotificationItem) {
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    } else {
      // Safe fallback
      this.router.navigateByUrl('/notifications');
    }
  }
  

  markAsRead(notificationId: string, event: Event) {
    event.stopPropagation();
    
    this.markingAsRead[notificationId] = true;
    this.notificationService.markAsSeen(notificationId).subscribe({
      next: () => {
        delete this.markingAsRead[notificationId];
      },
      error: (err) => {
        console.error('Failed to mark notification as read:', err);
        delete this.markingAsRead[notificationId];
      }
    });
  }

  markAllAsRead(event: Event) {
    event.stopPropagation();
    
    this.markingAllAsRead = true;
    this.notificationService.markAllAsSeen().subscribe({
      next: () => {
        this.markingAllAsRead = false;
      },
      error: (err) => {
        console.error('Failed to mark all notifications as read:', err);
        this.markingAllAsRead = false;
      }
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'POST_LIKED':
        return 'thumb_up';
      case 'POST_COMMENTED':
        return 'comment';
      case 'FOLLOWED':
        return 'person_add';
      case 'MESSAGE_SENT':
        return 'message';
      default:
        return 'notifications';
    }
  }

  getNotificationIconClass(type: string): string {
    switch (type) {
      case 'POST_LIKED':
        return 'post-liked';
      case 'POST_COMMENTED':
        return 'post-commented';
      case 'FOLLOWED':
        return 'followed';
      case 'MESSAGE_SENT':
        return 'message-sent';
      default:
        return '';
    }
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}