import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Institution, RegisterInstitutionRequest } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class SuperAdminInstitutionService {
  private baseUrl = 'http://localhost:3000/institutions';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // Get all institutions
  getAllInstitutions(): Observable<Institution[]> {
    return this.http.get<Institution[]>(`${this.baseUrl}`, { headers: this.getAuthHeaders() });
  }

  // Get approved institutions
  getApprovedInstitutions(): Observable<Institution[]> {
    return this.http.get<Institution[]>(`${this.baseUrl}/approved`, { headers: this.getAuthHeaders() });
  }

  // Approve or reject institution
  updateInstitutionStatus(
    institutionId: string,
    status: 'APPROVED' | 'REJECTED',
    reviewedById: string
  ): Observable<Institution> {
    return this.http.patch<Institution>(
      `${this.baseUrl}/${institutionId}/status`,
      { status, reviewedById },
      { headers: this.getAuthHeaders() }
    );
  }

  // Register institution
  registerInstitution(data: RegisterInstitutionRequest, file?: File): Observable<Institution> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description || '');
    formData.append('officialEmail', data.officialEmail);
    formData.append('officialDomain', data.officialDomain);
    formData.append('websiteUrl', data.websiteUrl);
    if (file) formData.append('logo', file);
  
    return this.http.post<Institution>(`${this.baseUrl}/register`, formData, { headers: this.getAuthHeaders() });
  }
  
  
}
