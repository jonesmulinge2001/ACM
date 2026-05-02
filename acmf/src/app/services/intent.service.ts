import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CreateIntentDto, Intent, IntentMatch } from '../interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IntentService {
  constructor(private http: HttpClient) {}

  private baseUrl = `${environment.apiBase}/intent`;

  // create intent
  createIntent(data: CreateIntentDto): Observable<Intent> {
    return this.http.post<Intent>(this.baseUrl, data);
  }

  // update intent
  updateIntent(id: string, data: Partial<CreateIntentDto>): Observable<Intent> {
    return this.http.patch<Intent>(`${this.baseUrl}/${id}`, data);
  }

  // get my intents
  getMyIntents(): Observable<Intent[]> {
    return this.http.get<Intent[]>(`${this.baseUrl}/me`);
  }

  // get intent matches
  getIntentMatches(): Observable<IntentMatch[]> {
    return this.http.get<IntentMatch[]>(`${this.baseUrl}/matches`);
  }

  // delete intent(Deactivate)

  deleteIntent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
