import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Group, GroupResource, GroupMessage, BulkAddMembersDto, BulkRemoveMembersDto, BulkRestoreMembersDto, BulkUpdateRolesDto } from '../interfaces';


@Injectable({ providedIn: 'root' })
export class GroupsService {
  private base = `${environment.apiBase}/groups`;

  constructor(private http: HttpClient) {}

  getAllGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.base);
  }

  getGroupById(groupId: string): Observable<Group> {
    return this.http.get<Group>(`${this.base}/${groupId}`);
  }

  createGroup(payload: Partial<Group>): Observable<Group> {
    return this.http.post<Group>(this.base, payload);
  }

  updateGroup(groupId: string, dto: Partial<Group> | FormData): Observable<Group> {
    return this.http.patch<Group>(`${this.base}/${groupId}`, dto);
  }

  joinGroup(groupId: string): Observable<any> {
    return this.http.post(`${this.base}/${groupId}/join`, {});
  }

  leaveGroup(groupId: string): Observable<any> {
    return this.http.post(`${this.base}/${groupId}/leave`, {});
  }

  shareResource(groupId: string, formData: FormData): Observable<GroupResource> {
    return this.http.post<GroupResource>(`${this.base}/${groupId}/resources`, formData);
  }

  getMessages(groupId: string, limit = 50, cursor?: string) {
    let params = new HttpParams().set('limit', String(limit));
    if (cursor) params = params.set('cursor', cursor);
    return this.http.get<GroupMessage[]>(`${this.base}/${groupId}/messages`, { params });
  }

  sendMessage(groupId: string, dto: { groupId: string; content: string }) {
    return this.http.post<GroupMessage>(`${this.base}/${groupId}/messages`, dto);
  }

  // bulk admin actions
  bulkAddMembers(groupId: string, dto: BulkAddMembersDto) {
    return this.http.post(`${this.base}/${groupId}/members/bulk-add`, dto);
  }
  bulkRemoveMembers(groupId: string, dto: BulkRemoveMembersDto) {
    return this.http.post(`${this.base}/${groupId}/members/bulk-remove`, dto);
  }
  bulkRestoreMembers(groupId: string, dto: BulkRestoreMembersDto) {
    return this.http.post(`${this.base}/${groupId}/members/bulk-restore`, dto);
  }
  bulkUpdateRoles(groupId: string, dto: BulkUpdateRolesDto) {
    return this.http.post(`${this.base}/${groupId}/members/bulk-update-roles`, dto);
  }

  addMemberAsAdmin(groupId: string, userId: string, role: 'OWNER'|'ADMIN'|'MEMBER') {
    return this.http.post(`${this.base}/${groupId}/members/${userId}`, { role });
  }
  removeMemberAsAdmin(groupId: string, userId: string) {
    return this.http.delete(`${this.base}/${groupId}/members/${userId}`);
  }
}
