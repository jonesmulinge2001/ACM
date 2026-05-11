import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Resource, UpdateResourceDto } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {

  private baseUrl = `${environment.apiBase}/resources`;

  constructor(
    private http: HttpClient
  ) {}

  // GET ALL
  getAll(): Observable<Resource[]> {
    return this.http.get<Resource[]>(this.baseUrl);
  }

  // GET ONE
  getOne(id: string): Observable<Resource> {
    return this.http.get<Resource>(`${this.baseUrl}/${id}`);
  }

    // GET PREVIEW URL — reuses the download endpoint directly
    getPreviewUrl(id: string): Observable<string> {
      return of(`${this.baseUrl}/${id}/download`);
    }

  // DOWNLOAD
  download(id: string): void {
    window.open(`${this.baseUrl}/${id}/download`, '_blank');
  }

  // UPDATE
  update(
    id: string,
    data: UpdateResourceDto
  ): Observable<Resource> {
    return this.http.patch<Resource>(
      `${this.baseUrl}/${id}`,
      data
    );
  }

  // DELETE
  delete(id: string): Observable<Resource> {
    return this.http.delete<Resource>(
      `${this.baseUrl}/${id}`
    );
  }
}