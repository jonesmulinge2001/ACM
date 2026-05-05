import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AcademicResourceResponse, CreateAcademicResource } from '../interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AcademicResourcesService {
  private baseUrl = `${environment.apiBase}/upload/academic-resource`

  constructor(
    private http: HttpClient
  ) { }

  //  Upload file
  uploadFile(
    data: CreateAcademicResource,
    file: File
  ): Observable<AcademicResourceResponse> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('type', data.type);
    formData.append('file', file);

    return this.http.post<AcademicResourceResponse>(this.baseUrl, formData);
  }

  // Upload via URL
  uploadViaUrl(data: CreateAcademicResource): Observable<AcademicResourceResponse> {
    return this.http.post<AcademicResourceResponse>(this.baseUrl, data);
  }
}
