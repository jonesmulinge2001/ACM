import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardOverview } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class AdmindashboardService {
  private baseUrl =  'http://localhost:3000/dashboard-overview';

  constructor(
    private http: HttpClient
  ) { }

  getOverview(): Observable<{ statusCode: number; message: string; data: DashboardOverview }> {
    return this.http.get<{ statusCode: number; message: string; data: DashboardOverview }>(
      `${this.baseUrl}/overview`
    );
  }
}
