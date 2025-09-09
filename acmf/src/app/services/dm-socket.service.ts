import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ConversationMessage } from '../interfaces';
import { environment } from '../../environments/environment';

interface JoinPayload {
  conversationId: string
}

interface TypingPayload {
  conversationId: string,
  userId: string,
  typing: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class DmSocketService implements OnDestroy {
  
  constructor() { }

  private socket?: Socket;

  private message$ = new Subject<ConversationMessage>();
  private typing$ = new Subject<TypingPayload>();
  private joined$ = new Subject<JoinPayload>();
  private error$ = new Subject<{message: string}>();

  connect(): void {
    if(this.socket?.connected) return;
    const token = localStorage.getItem('token');
    if(!token) throw new Error('No auth token for DM socket');
    const url = `${environment.socketBase1}/dm`;
    this.socket = io(url), {
      auth: { token },
      transports: ['websocket'],
    }

    this.socket.on('connect', () => console.debug('DM socket connected'));
    this.socket.on('disconnect', () => console.debug('DM socket disconnected'));

    this.socket.on('message', (m: ConversationMessage) => 
      this.message$.next(m),
    );
    this.socket.on('typing', (t: TypingPayload) => this.typing$.next(t));
    this.socket.on('joined', (j: JoinPayload) => this.joined$.next(j));
    this.socket.on('error', (err: { message: string}) => 
      this.error$.next(err)
    );
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
  }

  join(conversationId: string): void {
    this.socket?.emit('join', { conversationId});
  }

  leave(conversationId: string): void {
    this.socket?.emit('leave', { conversationId})
  }

  sendMessage(conversationId: string, content: string, tempId?: string): void {
    this.socket?.emit('message', { conversationId, content, tempId});
  }

  sendTyping(conversationId: string, typing: boolean): void {
    this.socket?.emit('typing', { conversationId, typing});
  }

  onMessage(): Observable<ConversationMessage> {
    return this.message$.asObservable();
  }

  onTyping(): Observable<TypingPayload> {
    return this.typing$.asObservable();
  }

  onJoined(): Observable<JoinPayload> {
    return this.joined$.asObservable();
  }

  onError(): Observable<{message: string}> {
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
