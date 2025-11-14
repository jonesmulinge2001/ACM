import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Group, GroupMember, BulkActionResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class AdminManageGroupsService {
  private baseUrl = 'http://localhost:3000/admin/groups';

  constructor(private http: HttpClient) {}
  // Get all groups */
  getAllGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.baseUrl}`, {
      withCredentials: true,
    });
  }
  

  /** Get members of a group */
  getGroupMembers(groupId: string): Observable<GroupMember[]> {
    return this.http.get<GroupMember[]>(
      `${this.baseUrl}/${groupId}/members`,
      { withCredentials: true }
    );
  }
  

  /** Soft-delete a group */
  deleteGroup(groupId: string): Observable<BulkActionResponse> {
    return this.http.delete<BulkActionResponse>(`${this.baseUrl}/${groupId}`);
  }

  /** Restore a soft-deleted group */
  restoreGroup(groupId: string): Observable<BulkActionResponse> {
    return this.http.patch<BulkActionResponse>(`${this.baseUrl}/${groupId}/restore`, {});
  }
}
