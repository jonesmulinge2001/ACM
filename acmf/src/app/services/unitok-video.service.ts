import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateVideoDto, Video, UpdateVideoDto } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  private readonly baseUrl = `${environment.apiBase}/videos`;

  constructor(private http: HttpClient) {}

  /** Common headers for JSON requests */
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  /** CREATE video via JSON (existing method) */
  createVideo(payload: CreateVideoDto): Observable<Video> {
    return this.http.post<Video>(this.baseUrl, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  /** CREATE video via FormData (for file upload) */
  uploadVideo(formData: FormData): Observable<Video> {
    // Do NOT set Content-Type here; HttpClient will set multipart/form-data automatically
    return this.http.post<Video>(this.baseUrl, formData);
  }

    // Upload video with progress tracking
    uploadVideoWithProgress(formData: FormData): Observable<HttpEvent<Video>> {
      return this.http.post<Video>(`${this.baseUrl}`, formData, {
        reportProgress: true,
        observe: 'events'
      });
    }
  

  /** GET all videos */
  getAllVideos(): Observable<Video[]> {
    return this.http.get<Video[]>(this.baseUrl, {
      headers: this.getAuthHeaders(),
    });
  }

  /** GET single video */
  getVideoById(videoId: string): Observable<Video> {
    return this.http.get<Video>(`${this.baseUrl}/${videoId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  /** UPDATE video */
  updateVideo(videoId: string, payload: UpdateVideoDto): Observable<Video> {
    return this.http.patch<Video>(`${this.baseUrl}/${videoId}`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  /** DELETE video */
  deleteVideo(videoId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${videoId}`, {
      headers: this.getAuthHeaders(),
    });
  }
}
