import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { DashboardOverview, InstitutionStats } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdmindashboardService {
  private readonly baseUrl = `${environment.apiBase}/dashboard-overview`;

  constructor(
    private http: HttpClient
  ) { }

  getOverview(): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>(`${this.baseUrl}/overview`);
  }

  getInstitutionStats(): Observable<InstitutionStats[]> {
    return this.http.get<InstitutionStats[]>(`${this.baseUrl}/activity`);
  }
  
  
}
