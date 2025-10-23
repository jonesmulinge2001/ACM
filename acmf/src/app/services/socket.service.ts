import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { GroupMessage } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket?: Socket;
  private message$ = new Subject<GroupMessage>();
  private userJoined$ = new Subject<any>();
  private userLeft$ = new Subject<any>();
  private connected$ = new Subject<boolean>();

  constructor(private auth: AuthService) {}

  connect(): void {
    if (this.socket && this.socket.connected) return;
    const token = localStorage.getItem('token')
    if (!token) throw new Error('No auth token for socket');

    // namespace is included in environment.socketBase (http://host:port/groups)
    this.socket = io(environment.socketBase, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => this.connected$.next(true));
    this.socket.on('disconnect', () => this.connected$.next(false));
    this.socket.on('message', (payload: GroupMessage) => this.message$.next(payload));
    this.socket.on('userJoined', (p) => this.userJoined$.next(p));
    this.socket.on('userLeft', (p) => this.userLeft$.next(p));
    this.socket.on('error', (err) => console.error('Socket error', err));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
  }

  join(groupId: string) {
    this.socket?.emit('join', { groupId });
  }

  leave(groupId: string) {
    this.socket?.emit('leave', { groupId });
  }

  sendMessage(groupId: string, content: string, replyToId?: string | null): void {
    this.socket?.emit('message', { groupId, content, replyToId });
  }

  onMessage(): Observable<GroupMessage> {
    return this.message$.asObservable();
  }
  onUserJoined() { return this.userJoined$.asObservable(); }
  onUserLeft() { return this.userLeft$.asObservable(); }
  onConnected() { return this.connected$.asObservable(); }

  ngOnDestroy() { this.disconnect(); }

  
}
