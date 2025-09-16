import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Conversation,
  ConversationMessage,
  ConversationSummary,
  SendMessageRequest,
  StartConversationRequest,
} from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConversationsService {
  private base = `${environment.apiBase}/conversations`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  /** Start a 1:1 conversation */
  createOneOnOne(participantId: string): Observable<Conversation> {
    const payload: StartConversationRequest = {
      participantIds: [participantId],
      isGroup: false,
    };
    return this.http.post<Conversation>(this.base, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  /** List conversations for sidebar */
  list(): Observable<ConversationSummary[]> {
    return this.http.get<ConversationSummary[]>(this.base, {
      headers: this.getAuthHeaders(),
    });
  }

  /** Fetch messages with cursor pagination */
  getMessages(
    conversationId: string,
    limit = 50,
    cursor?: string,
  ): Observable<ConversationMessage[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (cursor) params = params.set('cursor', cursor);
    return this.http.get<ConversationMessage[]>(
      `${this.base}/${conversationId}/messages`,
      {
        params,
        headers: this.getAuthHeaders(),
      },
    );
  }

  /** Send message via REST (backup to sockets) */
  sendMessage(
    conversationId: string,
    content: string,
  ): Observable<ConversationMessage> {
    const payload: SendMessageRequest = { conversationId, content };
    return this.http.post<ConversationMessage>(
      `${this.base}/${conversationId}/messages`,
      payload,
      { headers: this.getAuthHeaders() },
    );
  }

  getConversation(id: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.base}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
  
}
