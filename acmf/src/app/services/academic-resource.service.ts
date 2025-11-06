import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { saveAs } from 'file-saver';
import { AcademicResource, CreateAcademicResourceRequest } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AcademicResourceService {
  private readonly baseUrl = `${environment.apiBase}/academic-resources`;

  constructor(private http: HttpClient) {}

  // Get all resources (unfiltered)
  getAllResources(): Observable<AcademicResource[]> {
    return this.http.get<AcademicResource[]>(this.baseUrl);
  }

  // Upload a resource with file
  uploadResource(formData: FormData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.baseUrl, formData);
  }

  // >>> Search and filter resources
  searchResources(
    search?: string,
    course?: string,
    institution?: string,
    year?: string
  ): Observable<AcademicResource[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (course) params = params.set('course', course);
    if (institution) params = params.set('institution', institution);
    if (year) params = params.set('year', year);

    return this.http.get<AcademicResource[]>(this.baseUrl, { params });
  }

  // >>>> Increment download count
  incrementDownload(id: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.baseUrl}/${id}/download`,
      {}
    );
  }

  // >>> Trigger file download
  downloadResourceFile(resource: AcademicResource): void {
    if (!resource.fileUrl) return;

    // Increment download count
    this.incrementDownload(resource.id).subscribe();

    // Fetch the file as a Blob
    this.http.get(resource.fileUrl, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const filename = `${resource.title || 'file'}.pdf`;
        saveAs(blob, filename);
      },
      error: (err) => {
        console.error('Download failed:', err);
        alert('Download failed. Please try again.');
      },
    });
  }
}
