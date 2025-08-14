import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Post } from '../interfaces';
import { response } from 'express';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private baseUrl = 'http://localhost:3000/post';

  constructor(private http: HttpClient) {}
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  createPostWithFile(formData: FormData): Observable<Post> {
    return this.http.post<Post>(this.baseUrl, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  updatePostWithFile(postId: string, formData: FormData): Observable<Post> {
    const token = localStorage.getItem('token');
    return this.http.patch<Post>(`${this.baseUrl}/${postId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.baseUrl);
  }

  deletePost(postId: string): Observable<null> {
    return this.http.delete<null>(`${this.baseUrl}/${postId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getPostById(postId: string): Observable<Post> {
    return this.http.get<Post>(`${this.baseUrl}/${postId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getPostsByType(
    type: 'general' | 'academic' | 'resource' | 'opportunity'
  ): Observable<Post[]> {
    return this.http
      .get<{ success: boolean; message: string; data: Post[] }>(
        `${this.baseUrl}/${type}`,
        {
          headers: this.getAuthHeaders(),
        }
      )
      .pipe(map((response) => response.data));
  }
  getTrendingPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/trending`, {
      headers: this.getAuthHeaders(),
    });
  }

  getRecommendedPostsForUser(): Observable<Post[]> {
    return this.http.get<Post[]>(`http://localhost:3000/recommendations/user`, {
      headers: this.getAuthHeaders(),
    });
  }

  getSimilarPosts(postId: string): Observable<Post[]> {
    return this.http
      .get<{ success: boolean; message: string; data: Post[] }>(
        `http://localhost:3000/recommendations/post/${postId}`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(map((response) => response.data));
  }

  getPostsByUserId(userId: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/user/${userId}`, {
      headers: this.getAuthHeaders(),
    });
  }

getInfinitePosts(limit: number, cursor?: string): Observable<{ posts: Post[]; nextCursor?: string }> {
  let params: any = { limit };
  if (cursor) params.cursor = cursor;

  return this.http.get<{ posts: Post[]; nextCursor?: string }>(
    `${this.baseUrl}/infinite`,
    { params }
  );
}

}
