import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { StudentNotification } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationSocketService {
  private socket: Socket;

  constructor() {
    // connect to your NestJS WebSocket server
    this.socket = io(`${environment.apiBase}`, {
      transports: ['websocket'],
    });
  }

  /** Listen for new notifications */
  onNewNotification(): Observable<StudentNotification> {
    return new Observable((subscriber) => {
      this.socket.on('new-notification', (data: StudentNotification) => {
        subscriber.next(data);
      });
    });
  }

  /** Join student’s room (optional if you want student-specific notifications) */
  joinStudentRoom(studentId: string) {
    this.socket.emit('join', { studentId });
  }
}
