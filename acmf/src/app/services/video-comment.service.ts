import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { VideoComment, CreateVideoCommentRequest, UpdateVideoCommentRequest } from '../interfaces';


@Injectable({
  providedIn: 'root',
})
export class VideoCommentService {
  private readonly baseUrl = `${environment.apiBase}/video-comment`;

  constructor(private http: HttpClient) {}

  /** Common JSON headers */
  private jsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  /** Create a comment on a video */
  createComment(videoId: string, content: string): Observable<VideoComment> {
    const payload: CreateVideoCommentRequest = { content };
    return this.http.post<VideoComment>(
      `${this.baseUrl}/${videoId}`,
      payload,
      { headers: this.jsonHeaders() }
    );
  }

  /** Get all comments for a video */
  getComments(videoId: string): Observable<VideoComment[]> {
    return this.http.get<VideoComment[]>(
      `${this.baseUrl}/video/${videoId}`,
      { headers: this.jsonHeaders() }
    );
  }

  /** Update a comment */
  updateComment(commentId: string, content: string): Observable<VideoComment> {
    const payload: UpdateVideoCommentRequest = { content };
    return this.http.patch<VideoComment>(
      `${this.baseUrl}/${commentId}`,
      payload,
      { headers: this.jsonHeaders() }
    );
  }

  /** Delete a comment */
  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${commentId}`,
      { headers: this.jsonHeaders() }
    );
  }
}
