import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminUser, GenericResponse, BulkActionResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private baseUrl = 'http://localhost:3000/admin/users';

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.baseUrl);
  }

  getUserById(id: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.baseUrl}/${id}`);
  }

  updateUser(id: string, data: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.baseUrl}/${id}`, data);
  }

  deleteUser(id: string): Observable<GenericResponse> {
    return this.http.delete<GenericResponse>(`${this.baseUrl}/${id}`);
  }

  suspendUser(id: string): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.baseUrl}/${id}/suspend`, {});
  }

  restoreUser(id: string): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.baseUrl}/${id}/restore`, {});
  }

  massSuspend(ids: string[]): Observable<BulkActionResponse> {
    return this.http.patch<BulkActionResponse>(`${this.baseUrl}/suspend`, { ids });
  }

  massRestore(ids: string[]): Observable<BulkActionResponse> {
    return this.http.patch<BulkActionResponse>(`${this.baseUrl}/restore`, { ids });
  }

  deleteUsers(ids: string[]) {
    return this.http.delete<{ message: string }>(`${this.baseUrl}`, {
      body: { ids },
    });
  }
  
}
