import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StudentNotification, AnnouncementSummary } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StudentNotificationService {
  private readonly base = `${environment.apiBase}/student-notifications`;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  getNotifications(): Observable<StudentNotification[]> {
    return this.http.get<StudentNotification[]>(`${this.base}/notifications`, {
      headers: this.headers(),
    });
  }

  getUnread(): Observable<StudentNotification[]> {
    return this.http.get<StudentNotification[]>(`${this.base}/notifications/unread`, {
      headers: this.headers(),
    });
  }

  markAsRead(notificationId: string): Observable<any> {
    // backend expects PATCH /student-notifications/notifications/<id>/read
    return this.http.patch(`${this.base}/notifications/${notificationId}/read`, {}, {
      headers: this.headers(),
    });
  }

  // optional: fetch the actual announcement list for student view
  getAnnouncements(): Observable<AnnouncementSummary[]> {
    return this.http.get<AnnouncementSummary[]>(`${this.base}/announcements`, {
      headers: this.headers(),
    });
  }
}
