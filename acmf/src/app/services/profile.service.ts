import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Follow, Profile, ProfileView } from '../interfaces';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private baseUrl = 'http://localhost:3000/profiles';
  private followurl = 'http://localhost:3000/follow';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  createProfile(profile: Profile): Observable<Profile> {
    return this.http.post<Profile>(`${this.baseUrl}`, profile, {
      headers: this.getAuthHeaders(),
    });
  }

  updateProfile(profile: Partial<Profile>): Observable<Profile> {
    return this.http.patch<Profile>(`${this.baseUrl}`, profile, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadProfileImage(file: File): Observable<Profile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Profile>(`${this.baseUrl}/upload-image`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadCoverPhoto(file: File): Observable<Profile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Profile>(`${this.baseUrl}/upload-cover`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  getProfileByUserId(userId: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/${userId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getMyProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/me`, {
      headers: this.getAuthHeaders(),
    }).pipe(
      delay(2000) 
    );
  }

  getAllProfiles(searchTerm?: string): Observable<Profile[]> {
    const headers = this.getAuthHeaders();

    const params = searchTerm ? { search: searchTerm } : undefined;

    return this.http.get<Profile[]>(this.baseUrl, {
      headers,
      params,
    });
  }

  followUser(userId: string): Observable<Follow> {
    return this.http.post<Follow>(`${this.followurl}/${userId}`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  unFollowUser(userId: string): Observable<{}> {
    return this.http.delete(`${this.followurl}/${userId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getFollowers(userId: string): Observable<Follow[]> {
    return this.http.get<Follow[]>(`${this.followurl}/followers/${userId}`,  {
      headers: this.getAuthHeaders()
    })
  }

  getFollowing(userId: string): Observable<Follow[]> {
    return this.http.get<Follow[]>(`${this.followurl}/following/${userId}`, {
      headers: this.getAuthHeaders()
    })
  }
  

}
