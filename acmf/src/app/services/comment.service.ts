
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Comment, CommentResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private baseUrl = 'http://localhost:3000/comments';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  createComment(postId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(this.baseUrl, { postId, content}, {
      headers: this.getAuthHeaders()
    });
  }

  getComments(postId: string): Observable<CommentResponse> {
    return this.http.get<CommentResponse>(`${this.baseUrl}/${postId}`, {
      headers: this.getAuthHeaders()
    });
  }

  editComment(commentId: string, content: string): Observable<Comment> {
    return this.http.patch<Comment>(`${this.baseUrl}/${commentId}`, { content}, {
      headers: this.getAuthHeaders()
    });
  }

  deleteComment(commentId: string): Observable<Comment> {
    return this.http.delete<Comment>(`${this.baseUrl}/${commentId}`, {
      headers: this.getAuthHeaders()
    });
  }
}
