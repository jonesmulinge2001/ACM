import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Announcement } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InstitutionService {
  private readonly baseUrl = `${environment.apiBase}/institutions`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if(!token){
      return new HttpHeaders();
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  /** ---------------- CREATE ---------------- */
  createAnnouncement(
    institutionId: string,
    data: { title: string; content: string },
    files?: File[],
  ): Observable<Announcement> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (files) {
      files.forEach((file) => formData.append('files', file));
    }

    return this.http.post<Announcement>(
      `${this.baseUrl}/${institutionId}/announcement`,
      formData,
      { headers: this.getAuthHeaders() },
    );
  }

  /** ---------------- UPDATE ---------------- */
  updateAnnouncement(
    announcementId: string,
    data: { title?: string; content?: string },
    files?: File[],
  ): Observable<Announcement> {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);

    if (files) {
      files.forEach((file) => formData.append('files', file));
    }

    return this.http.patch<Announcement>(
      `${this.baseUrl}/announcements/${announcementId}`,
      formData,
      { headers: this.getAuthHeaders() },
    );
  }

  /** ---------------- DELETE ---------------- */
  deleteAnnouncement(announcementId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/announcements/${announcementId}`,
      { headers: this.getAuthHeaders() },
    );
  }

  /** ---------------- MY ANNOUNCEMENTS ---------------- */
  getMyAnnouncements(institutionId: string): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(
      `${this.baseUrl}/my-announcements`,
      { headers: this.getAuthHeaders() },
    );
  }

  /** ---------------- GET BY ID ---------------- */
  getAnnouncementById(announcementId: string): Observable<Announcement> {
    return this.http.get<Announcement>(
      `${this.baseUrl}/${announcementId}`,
      { headers: this.getAuthHeaders() },
    );
  }

  /** ---------------- ANALYTICS ---------------- */
  getAnalytics(institutionId: string): Observable<{
    studentCount: number;
    announcementCount: number;
  }> {
    return this.http.get<{ studentCount: number; announcementCount: number }>(
      `${this.baseUrl}/${institutionId}/analytics`,
      { headers: this.getAuthHeaders() },
    );
  }

  getInstitutions(): Observable<{ id: string; name: string }[]> {
    return this.http.get<{ id: string; name: string }[]>(this.baseUrl);
  }
}
