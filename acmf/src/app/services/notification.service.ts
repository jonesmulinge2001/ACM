import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import {
  NotificationItem,
  NotificationEventPayload,
  NotificationListResponse,
} from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = `${environment.apiBase}/notifications`;
  private socket!: Socket;

  private _notifications = new BehaviorSubject<NotificationItem[]>([]);
  notifications$ = this._notifications.asObservable();

  private _unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this._unreadCount.asObservable();

  private lastCursor: string | null = null;
  private fetching: boolean = false;

  constructor(private http: HttpClient) {
    this.initSocket();
  }

  fetchNotifications(loadMore = false): void {
    if (this.fetching) return;
    this.fetching = true;
  
    let url = this.apiUrl;
    if (loadMore && this.lastCursor) {
      url += `?cursor=${this.lastCursor}`;
    }
  
    this.http.get<NotificationListResponse>(url).subscribe({
      next: (res) => {
        const data = res.notifications;
        if (data.length > 0) {
          this.lastCursor = data[data.length - 1].id;
        }
        const merged = loadMore
          ? [...this._notifications.value, ...data]
          : data;
        this._notifications.next(merged);
        this._unreadCount.next(res.unreadCount);
      },
      complete: () => (this.fetching = false),
      error: (err) => {
        console.error(err);
        this.fetching = false; // ← THE ACTUAL BUG: was missing, blocking all future fetches
      },
    });
  }
  
  private initSocket(): void {
    const token = localStorage.getItem('token') ?? '';
    this.socket = io(`${environment.apiBase}/notifications`, { // ← match the gateway namespace
      auth: { token },
    });
  
    this.socket.on('notification', () => {
      this.fetching = false; // ensure the guard doesn't block this fetch
      this.fetchNotifications(false);
    });
  }
  /** ================= MARK AS SEEN ================= */
  markAsSeen(notificationId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${notificationId}/seen`, {});
  }

  markAllAsSeen(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/seen`, {});
  }



  /** ================= REALTIME MESSAGE ================= */
  private buildRealtimeMessage(type: NotificationItem['type']): string {
    switch (type) {
      case 'POST_LIKED':
        return 'Someone liked your post';

      case 'POST_COMMENTED':
        return 'Someone commented on your post';

      case 'FOLLOWED':
        return 'You have a new follower';

      case 'MESSAGE_SENT':
        return 'You have a new message';

      case 'INTENT_OVERLAP':
        return 'Someone shares your interests';

      case 'PROFILE_VIEWED':
        return 'Someone viewed your profile';

      default:
        return 'You have a new notification';
    }
  }
}