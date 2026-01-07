import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpHeaders,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import { filter, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Group,
  GroupResource,
  GroupMessage,
  BulkAddMembersDto,
  BulkRemoveMembersDto,
  BulkRestoreMembersDto,
  BulkUpdateRolesDto,
  GroupResourceComment,
} from '../interfaces';

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private base = `${environment.apiBase}/groups`;

  constructor(private http: HttpClient) {}

  //  Attach token from localStorage
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // All authenticated routes should use headers

  getAllGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.base, {
      headers: this.getAuthHeaders(),
    });
  }

  getGroupById(groupId: string): Observable<Group> {
    return this.http.get<Group>(`${this.base}/${groupId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  createGroup(payload: Partial<Group>): Observable<Group> {
    return this.http.post<Group>(this.base, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  updateGroup(
    groupId: string,
    dto: Partial<Group> | FormData
  ): Observable<Group> {
    return this.http.patch<Group>(`${this.base}/${groupId}`, dto, {
      headers: this.getAuthHeaders(),
    });
  }

  joinGroup(groupId: string): Observable<any> {
    return this.http.post(
      `${this.base}/${groupId}/join`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  leaveGroup(groupId: string): Observable<any> {
    return this.http.post(
      `${this.base}/${groupId}/leave`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  //  Share text or file resource
  shareResource(
    groupId: string,
    formData: FormData
  ): Observable<GroupResource> {
    return this.http.post<GroupResource>(
      `${this.base}/${groupId}/resources`,
      formData,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Messages
  // ------------------ FETCH MESSAGES ------------------
  getMessages(
    groupId: string,
    limit = 50,
    cursor?: string
  ): Observable<GroupMessage[]> {
    let params = new HttpParams().set('limit', String(limit));
    if (cursor) params = params.set('cursor', cursor);
    return this.http.get<GroupMessage[]>(`${this.base}/${groupId}/messages`, {
      params,
      headers: this.getAuthHeaders(),
    });
  }

  // ------------------ SEND MESSAGE (TEXT OR FILE) ------------------
  sendMessage(
    groupId: string,
    content?: string,
    files?: File[], // note: accept an array
    replyToId?: string,
    progressCb?: (progress: number) => void
  ): Observable<GroupMessage> {
    const formData = new FormData();

    if (content) formData.append('content', content);
    if (files && files.length > 0) {
      for (const file of files) {
        formData.append('attachments', file); // must match backend
      }
    }
    if (replyToId) formData.append('replyToId', replyToId);

    return this.http
      .post<GroupMessage>(`${this.base}/${groupId}/messages`, formData, {
        headers: this.getAuthHeaders(),
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        map((event) => {
          if (event.type === HttpEventType.UploadProgress && progressCb) {
            const percentDone = Math.round(
              (100 * (event.loaded ?? 0)) / (event.total ?? 1)
            );
            progressCb(percentDone);
          }
          if (event.type === HttpEventType.Response) {
            return event.body as GroupMessage;
          }
          return null;
        }),
        filter((res): res is GroupMessage => res !== null)
      );
  }

  // Bulk admin actions
  bulkAddMembers(groupId: string, dto: BulkAddMembersDto) {
    return this.http.post(`${this.base}/${groupId}/members/bulk-add`, dto, {
      headers: this.getAuthHeaders(),
    });
  }

  bulkRemoveMembers(groupId: string, dto: BulkRemoveMembersDto) {
    return this.http.post(`${this.base}/${groupId}/members/bulk-remove`, dto, {
      headers: this.getAuthHeaders(),
    });
  }

  bulkRestoreMembers(groupId: string, dto: BulkRestoreMembersDto) {
    return this.http.post(`${this.base}/${groupId}/members/bulk-restore`, dto, {
      headers: this.getAuthHeaders(),
    });
  }

  bulkUpdateRoles(groupId: string, dto: BulkUpdateRolesDto) {
    return this.http.post(
      `${this.base}/${groupId}/members/bulk-update-roles`,
      dto,
      { headers: this.getAuthHeaders() }
    );
  }

  addMemberAsAdmin(
    groupId: string,
    userId: string,
    role: 'OWNER' | 'ADMIN' | 'MEMBER'
  ) {
    return this.http.post(
      `${this.base}/${groupId}/members/${userId}`,
      { role },
      { headers: this.getAuthHeaders() }
    );
  }

  removeMemberAsAdmin(groupId: string, userId: string) {
    return this.http.delete(`${this.base}/${groupId}/members/${userId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Feed (posts/resources)
  getGroupFeed(
    groupId: string,
    page = 1,
    limit = 10
  ): Observable<GroupResource[]> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<GroupResource[]>(`${this.base}/${groupId}/feed`, {
      params,
      headers: this.getAuthHeaders(),
    });
  }

  createFeedPost(
    groupId: string,
    payload: { content: string; resourceUrl?: string | null }
  ): Observable<GroupResource> {
    return this.http.post<GroupResource>(
      `${this.base}/${groupId}/feed`,
      payload,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  likeFeedPost(
    groupId: string,
    postId: string
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/${groupId}/feed/${postId}/like`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  unlikeFeedPost(
    groupId: string,
    postId: string
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.base}/${groupId}/feed/${postId}/like`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Comments
  getFeedComments(
    groupId: string,
    postId: string
  ): Observable<GroupResourceComment[]> {
    return this.http.get<GroupResourceComment[]>(
      `${this.base}/${groupId}/feed/${postId}/comments`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  addFeedComment(
    groupId: string,
    postId: string,
    content: string
  ): Observable<GroupResourceComment> {
    return this.http.post<GroupResourceComment>(
      `${this.base}/resources/${postId}/comment`,
      { content },
      { headers: this.getAuthHeaders() }
    );
  }

  editFeedComment(
    commentId: string,
    content: string
  ): Observable<GroupResourceComment> {
    return this.http.patch<GroupResourceComment>(
      `${this.base}/resources/comments/${commentId}`,
      { content },
      { headers: this.getAuthHeaders() }
    );
  }

  deleteFeedComment(commentId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/resources/comments/${commentId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  likeFeedComment(commentId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/comments/${commentId}/like`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  unlikeFeedComment(commentId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/comments/${commentId}/unlike`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  getGroupResources(groupId: string, limit = 20) {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<GroupResource[]>(`${this.base}/${groupId}/resources`, {
      params,
      headers: this.getAuthHeaders(),
    });
  }

  //  Update group resource (content + optional file)
  updateGroupResource(
    groupId: string,
    resourceId: string,
    content: string,
    file?: File
  ): Observable<GroupResource> {
    const formData = new FormData();
    formData.append('content', content);
    if (file) {
      formData.append('file', file);
    }
    return this.http.patch<GroupResource>(
      `${this.base}/${groupId}/resources/${resourceId}`,
      formData
    );
  }

  // Delete a group resource (post)
  deleteGroupResource(
    groupId: string,
    resourceId: string
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.base}/${groupId}/resources/${resourceId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Edit a message
  editMessage(messageId: string, content: string): Observable<GroupMessage> {
    return this.http.patch<GroupMessage>(
      `${this.base}/messages/${messageId}`,
      { content },
      { headers: this.getAuthHeaders() }
    );
  }

  //  Delete a message
  deleteMessage(messageId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.base}/messages/${messageId}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
