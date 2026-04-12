import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Group, Post, Profile } from '../interfaces';

export interface RecommendedPosts {
  resource: Post[];
  academic: Post[];
  opportunity: Post[];
  general: Post[];
}

export interface RecommendationsResponse {
  profiles: Profile[];
  resources: RecommendedPosts;
}

@Injectable({
  providedIn: 'root',
})
export class RecommenderService {
  private readonly baseUrl = 'http://localhost:3000/recommendations';

  constructor(private http: HttpClient) {}


  // GET /recommendations/user
  // Full scored recommendations (profiles + posts by type) for the logged-in user
  getRecommendations(): Observable<RecommendationsResponse> {
    return this.http.get<RecommendationsResponse>(`${this.baseUrl}/user`);
  }

  // GET /recommendations/post/:postId
  // Posts similar to a given post (same type + overlapping tags)
  recommendSimilarPosts(postId: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/post/${postId}`);
  }

  // GET /recommendations/groups/skills
  // Public groups whose members share skills with the logged-in user
  recommendGroupsBySkills(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.baseUrl}/groups/skills`);
  }

  // GET /recommendations/profiles/skills
  // Profiles that share the most skills with the logged-in user
  suggestProfilesBySkills(): Observable<Profile[]> {
    return this.http.get<Profile[]>(`${this.baseUrl}/profiles/skills`);
  }

  // GET /recommendations/profiles/interests
  // Profiles that share the most interests with the logged-in user
  suggestProfilesByInterests(): Observable<Profile[]> {
    return this.http.get<Profile[]>(`${this.baseUrl}/profiles/interests`);
  }

  // GET /recommendations/profiles/course
  // Profiles in the same course as the logged-in user
  suggestProfilesByCourse(): Observable<Profile[]> {
    return this.http.get<Profile[]>(`${this.baseUrl}/profiles/course`);
  }

  // GET /recommendations/profiles/academic-level
  // Profiles at the same academic level as the logged-in user
  suggestProfilesByAcademicLevel(): Observable<Profile[]> {
    return this.http.get<Profile[]>(`${this.baseUrl}/profiles/academic-level`);
  }

  // GET /recommendations/profiles/institution
  // Profiles from the same institution as the logged-in user
  suggestProfilesByInstitution(): Observable<Profile[]> {
    return this.http.get<Profile[]>(`${this.baseUrl}/profiles/institution`);
  }
}