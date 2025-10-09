// src/app/services/dm-socket.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../environments/environment';
import {
  ConversationMessage,
  DmTypingEvent,
  DmSocketSendPayload,
} from '../interfaces';

@Injectable({ providedIn: 'root' })
export class DmSocketService implements OnDestroy {
  private socket?: Socket;

  private message$ = new Subject<ConversationMessage>();
  private typing$ = new Subject<DmTypingEvent>();
  private joined$ = new Subject<{ conversationId: string }>();
  private error$ = new Subject<{ message: string }>();

  connect(): void {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token for DM socket');

    const url = `${environment.socketBase1}/dm`;
    this.socket = io(url, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => console.debug('DM socket connected'));
    this.socket.on('disconnect', () => console.debug('DM socket disconnected'));

    this.socket.on('message', (m: ConversationMessage) =>
      this.message$.next(m)
    );

    this.socket.on('error', (err: { message: string }) => {
      console.error('[WS error]', err);
      this.error$.next(err);
    });
    this.socket.on('typing', (t: DmTypingEvent) => this.typing$.next(t));
    this.socket.on('joined', (j: { conversationId: string }) =>
      this.joined$.next(j)
    );
    this.socket.on('error', (err: { message: string }) =>
      this.error$.next(err)
    );
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
  }

  join(conversationId: string): void {
    this.socket?.emit('join', { conversationId });
  }

  leave(conversationId: string): void {
    this.socket?.emit('leave', { conversationId });
  }

  sendMessage(payload: DmSocketSendPayload): void {
    this.socket?.emit('message', payload);
  }

  sendTyping(conversationId: string, typing: boolean): void {
    this.socket?.emit('typing', { conversationId, typing });
  }

  // Observables
  onMessage(): Observable<ConversationMessage> {
    return this.message$.asObservable();
  }
  onTyping(): Observable<DmTypingEvent> {
    return this.typing$.asObservable();
  }
  onJoined(): Observable<{ conversationId: string }> {
    return this.joined$.asObservable();
  }
  onError(): Observable<{ message: string }> {
    return this.error$.asObservable();
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.message$.complete();
    this.typing$.complete();
    this.joined$.complete();
    this.error$.complete();
  }
}
