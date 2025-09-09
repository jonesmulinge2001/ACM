import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Conversation, ConversationMessage } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ConversationsService {
  private base = `${environment.apiBase}/conversations`;

  constructor(
    private http: HttpClient
  ) { }

  createOneOnOne(participantId: string): Observable<Conversation> {
    return this.http.post<Conversation>(this.base, {
      isGroup: false,
      participantIds: [participantId]
    });
  }

  list(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(this.base);
  }

  getMessages(
    conversationId: string,
    limit = 50,
    cursor?: string,
  ): Observable<ConversationMessage[]> {
    let params = new HttpParams().set('cursor', cursor!);
    if(cursor) params = params.set('cursor', cursor);
    return this.http.get<ConversationMessage[]> (
      `${this.base}/${conversationId}/messages`,
      {params}
    );
  }

  sendMessage(
    conversationId: string,
    content: string,
  ): Observable<ConversationMessage> {
    return this.http.post<ConversationMessage>(
      `${this.base}/${conversationId}/messages`,
      {content}
    )
  }
}
