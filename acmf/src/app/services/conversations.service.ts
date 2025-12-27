import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpEventType } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Conversation,
  ConversationMessage,
  ConversationSummary,
  SendMessageRequest,
  StartConversationRequest,
  MessageAttachment
} from '../interfaces';
import { environment } from '../../environments/environment';

export interface FileUploadProgress {
  progress: number; // 0-100
  done: boolean;
  message?: ConversationMessage;
}

@Injectable({ providedIn: 'root' })
export class ConversationsService {
  private base = `${environment.apiBase}/conversations`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  /** Start a 1:1 conversation */
  createOneOnOne(participantId: string): Observable<Conversation> {
    const payload: StartConversationRequest = { participantIds: [participantId], isGroup: false };
    return this.http.post<Conversation>(this.base, payload, { headers: this.getAuthHeaders() });
  }

  /** List conversations */
  list(): Observable<ConversationSummary[]> {
    return this.http.get<ConversationSummary[]>(this.base, { headers: this.getAuthHeaders() });
  }

  /** Fetch messages */
  getMessages(conversationId: string, limit = 50, cursor?: string): Observable<ConversationMessage[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (cursor) params = params.set('cursor', cursor);
    return this.http.get<ConversationMessage[]>(`${this.base}/${conversationId}/messages`, { params, headers: this.getAuthHeaders() });
  }

  /** Send plain text message */
  sendMessage(conversationId: string, content: string): Observable<ConversationMessage> {
    const payload: SendMessageRequest = { conversationId, content };
    return this.http.post<ConversationMessage>(`${this.base}/${conversationId}/messages`, payload, { headers: this.getAuthHeaders() });
  }

  /** Send message with multiple files & optional content + track progress */
  sendMessageWithFiles(
    conversationId: string,
    content?: string,
    files?: File[],
    onProgress?: (progress: number) => void
  ): Observable<ConversationMessage> {
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (files && files.length > 0) {
      files.forEach(file => formData.append('attachments', file));
    }

    return new Observable<ConversationMessage>((subscriber) => {
      this.http.post<ConversationMessage>(
        `${this.base}/${conversationId}/messages`,
        formData,
        {
          headers: this.getAuthHeaders(),
          reportProgress: true,
          observe: 'events'
        }
      ).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const percent = Math.round((event.loaded / event.total) * 100);
            if (onProgress) onProgress(percent);
          } else if (event.type === HttpEventType.Response) {
            subscriber.next(event.body as ConversationMessage);
            subscriber.complete();
          }
        },
        error: (err) => subscriber.error(err)
      });
    });
  }

  /** Fetch single conversation */
  getConversation(id: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.base}/${id}`, { headers: this.getAuthHeaders() });
  }
}
