import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalSearchResult } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
   private api = `${environment.apiBase}`

  constructor(
    private http: HttpClient
  ) { }

  search(query: string): Observable<GlobalSearchResult> {
    return this.http.get<GlobalSearchResult>(`${this.api}/search`, {
      params: { q: query },
    });
  }
}
