import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InstitutionService {
  private readonly baseUrl = `${environment.apiBase}/institutions`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if(!token){
      return new HttpHeaders();
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getInstitutions(): Observable<{ id: string; name: string }[]> {
    return this.http.get<{ id: string; name: string }[]>(this.baseUrl);
  }
}
