import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Follow, ProfileView } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class FollowService {
  private followurl = 'http://localhost:3000/follow';

  constructor(
    private http: HttpClient
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  followUser(userId: string): Observable<Follow> {
    return this.http.post<Follow>(`${this.followUser}/${userId}`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  unFollowUser(userId: string): Observable<{ count: number }> {
    return this.http.delete<{ count: number }>(`${this.followurl}/${userId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getFollowers(userId: string): Observable<Follow[]> {
    return this.http.get<Follow[]>(`${this.followurl}/followers/${userId}`,  {
      headers: this.getAuthHeaders()
    });
  }

  getFollowing(userId: string): Observable<Follow[]> {
    return this.http.get<Follow[]>(`${this.followurl}/following/${userId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getProfileViewers(userId: string): Observable<ProfileView[]> {
    return this.http.get<ProfileView[]>(`http://localhost:3000/profile-views/${userId}/recent`, {
      headers: this.getAuthHeaders()
    });
  }
  
  getFollowStats(userId: string): Observable<{ followers: number; following: number}> {
    return this.http.get<{ followers: number; following: number}>(
      `http://localhost:3000/follow/${userId}/stats`, {
        headers: this.getAuthHeaders(),
      }
    );
  }
}
