import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { NotificationItem, NotificationEventPayload } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = 'http://localhost:3000/notifications';
  private socket!: Socket;

  private _notifications = new BehaviorSubject<NotificationItem[]>([]);
  notifications$ = this._notifications.asObservable();

  private _unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this._unreadCount.asObservable();

  private lastCursor: string | null = null;
  private fetching = false;

  constructor(private http: HttpClient) {
    this.initSocket();
  }

  /** Fetch notifications from backend */

  fetchNotifications(loadMore = false): void {
    if (this.fetching) return;
    this.fetching = true;

    let url = this.apiUrl;
    if (loadMore && this.lastCursor) {
      url += `?cursor=${this.lastCursor}`;
    }

    this.http.get<NotificationItem[]>(url).subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.lastCursor = data[data.length - 1].id; // last item's id
        }

        if (loadMore) {
          this._notifications.next([...this._notifications.value, ...data]);
        } else {
          this._notifications.next(data);
        }

        this._unreadCount.next(
          this._notifications.value.filter((n) => !n.seen).length
        );
      },
      error: (err) => console.error('Failed to fetch notifications', err),
      complete: () => (this.fetching = false),
    });
  }

  /** Mark single notification as seen */
  markAsSeen(notificationId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${notificationId}/seen`, {});
  }

  /** Mark all notifications as seen */
  markAllAsSeen(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/seen`, {});
  }

  /** Initialize Socket.IO */
  private initSocket(): void {
    const token = localStorage.getItem('token') ?? '';
    this.socket = io('http://localhost:3000', { auth: { token } });

    this.socket.on('connect', () =>
      console.log('Notifications socket connected', this.socket.id)
    );

    this.socket.on('notification', (event: NotificationEventPayload) => {
      console.log('Notification received:', event);
      this.handleIncomingEvent(event);
    });
  }

  /** Handle incoming event and aggregate if necessary */
  private handleIncomingEvent(event: NotificationEventPayload): void {
    const current = this._notifications.value;

    // Look for existing aggregated notification
    const existingIndex = current.findIndex(
      (n) => n.type === event.type && n.entityId === (event.entityId ?? null)
    );

    if (existingIndex > -1) {
      const updated = [...current];
      const existing = updated[existingIndex];

      if (!existing.actorIds.includes(event.actorId)) {
        existing.actorIds.push(event.actorId);
        existing.actorNames.push(event.actorName);
        existing.count = existing.actorIds.length;
        existing.seen = false;
      }

      updated[existingIndex] = existing;
      this._notifications.next(updated);
    } else {
      const newNotification: NotificationItem = {
        id: event.entityId ?? crypto.randomUUID(),
        type: event.type,
        entityId: event.entityId ?? null,
        actorIds: [event.actorId],
        actorNames: [event.actorName],
        count: 1,
        seen: false,
        message: this.buildMessage(event.type, [event.actorName]),
        createdAt: event.createdAt,
      };
      this._notifications.next([newNotification, ...current]);
    }

    // Update unread count
    this._unreadCount.next(
      this._notifications.value.filter((n) => !n.seen).length
    );
  }

  /** Format notification message (LinkedIn style) */
  private buildMessage(
    type: NotificationItem['type'],
    actorNames: string[]
  ): string {
    switch (type) {
      case 'POST_LIKED':
        if (actorNames.length === 1) return `${actorNames[0]} liked your post`;
        return `${actorNames[0]} and ${
          actorNames.length - 1
        } others liked your post`;
      case 'POST_COMMENTED':
        if (actorNames.length === 1)
          return `${actorNames[0]} commented on your post`;
        return `${actorNames[0]} and ${
          actorNames.length - 1
        } others commented on your post`;
      case 'FOLLOWED':
        if (actorNames.length === 1)
          return `${actorNames[0]} started following you`;
        return `${actorNames[0]} and ${
          actorNames.length - 1
        } others started following you`;
      case 'MESSAGE_SENT':
        if (actorNames.length === 1)
          return `${actorNames[0]} sent you a message`;
        return `${actorNames[0]} and ${
          actorNames.length - 1
        } others sent you messages`;
      default:
        return 'You have a new notification';
    }
  }
}
