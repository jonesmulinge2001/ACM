import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { VideoLikeResponse, LikeStatusResponse } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class VideoLikeService {
  private readonly baseUrl = `${environment.apiBase}/video-like`;

  constructor(private http: HttpClient) {}

  /** Common headers */
  private jsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  /** Like a video */
  likeVideo(videoId: string): Observable<VideoLikeResponse> {
    return this.http.post<VideoLikeResponse>(
      `${this.baseUrl}/${videoId}`,
      {}, // backend expects POST body empty
      { headers: this.jsonHeaders() }
    );
  }

  /** Unlike a video */
  unlikeVideo(videoId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${videoId}`, {
      headers: this.jsonHeaders(),
    });
  }

  /** Check if current user liked the video */
  hasLiked(videoId: string): Observable<LikeStatusResponse> {
    return this.http.get<LikeStatusResponse>(
      `${this.baseUrl}/${videoId}/status`,
      { headers: this.jsonHeaders() }
    );
  }
}
