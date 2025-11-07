/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  AdminPost,
  PostFlag,
  ChangePostStatusRequest,
  UpdateFlagStatusRequest,
  BulkPostIds,
} from '../interfaces';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminPostService {
  private readonly baseUrl = `${environment.apiBase}/post-management`;

  constructor(private http: HttpClient) {}

  // Posts
  getAllPosts(): Observable<AdminPost[]> {
    return this.http
      .get<AdminPost[]>(`${this.baseUrl}`)
      .pipe(catchError(this.handle));
  }

  getPostById(id: string): Observable<AdminPost> {
    return this.http
      .get<AdminPost>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handle));
  }

  changeStatus(id: string, action: ChangePostStatusRequest['action']): Observable<AdminPost> {
    return this.http
      .patch<AdminPost>(`${this.baseUrl}/${id}/status`, { action })
      .pipe(catchError(this.handle));
  }

  hardDelete(id: string): Observable<AdminPost> {
    return this.http
      .delete<AdminPost>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handle));
  }

  // Flags
  getFlaggedPosts(): Observable<PostFlag[]> {
    return this.http
      .get<PostFlag[]>(`${this.baseUrl}/flagged`)
      .pipe(catchError(this.handle));
  }

  updateFlagStatus(flagId: string, status: UpdateFlagStatusRequest['status']): Observable<PostFlag> {
    return this.http
      .patch<PostFlag>(`${this.baseUrl}/flag/${flagId}/status`, { status })
      .pipe(catchError(this.handle));
  }

  softDeleteFlaggedPost(postId: string): Observable<AdminPost> {
    return this.http
      .patch<AdminPost>(`${this.baseUrl}/flagged/${postId}/delete`, {})
      .pipe(catchError(this.handle));
  }

  restoreFlaggedPost(postId: string): Observable<AdminPost> {
    return this.http
      .patch<AdminPost>(`${this.baseUrl}/flagged/${postId}/restore`, {})
      .pipe(catchError(this.handle));
  }

  // Bulk
  bulkDelete(postIds: string[]): Observable<AdminPost[]> {
    const payload: BulkPostIds = { postIds };
    return this.http
      .post<AdminPost[]>(`${this.baseUrl}/bulk/delete`, payload)
      .pipe(catchError(this.handle));
  }

  bulkRestore(postIds: string[]): Observable<AdminPost[]> {
    const payload: BulkPostIds = { postIds };
    return this.http
      .post<AdminPost[]>(`${this.baseUrl}/bulk/restore`, payload)
      .pipe(catchError(this.handle));
  }

  bulkRemoveFlags(postIds: string[]): Observable<PostFlag[]> {
    const payload: BulkPostIds = { postIds };
    return this.http
      .post<PostFlag[]>(`${this.baseUrl}/bulk/remove-flags`, payload)
      .pipe(catchError(this.handle));
  }

  private handle(err: any) {
    const message = err?.error?.message || err?.message || 'Request failed';
    return throwError(() => new Error(message));
  }
}
