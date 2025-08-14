import { PostLikeResponse } from './../interfaces';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LikeService {
  private readonly baseUrl = 'http://localhost:3000/likes'

  constructor(
    private http: HttpClient
  ) {  }

  likePost(postId: string): Observable<{ success: boolean}> {
    return this.http.post<{ success: boolean}>(`${this.baseUrl}`, {postId});
  }

  unLikePost(postId: string): Observable<{ success: boolean}> {
    return this.http.post<{ success: boolean}>(`${this.baseUrl}/unlike`, { postId});
  }

  getPostLikes(postId: string): Observable<PostLikeResponse> {
    return this.http.get<PostLikeResponse>(`${this.baseUrl}/${postId}/likes`);
  }
}
