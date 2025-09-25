/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable prettier/prettier */
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { StudentNotificationDto } from 'src/dto/student-notification';
  
  @WebSocketGateway({ cors: { origin: '*' } })
  export class NotificationsGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;
  
    handleConnection(client: Socket) {
      console.log(`Client connected: ${client.id}`);
  
      // client sends studentId via query string
      const studentId = client.handshake.query.studentId as string;
      if (studentId) {
        client.join(studentId);
        console.log(`Student ${studentId} joined their room`);
      }
    }
  
    /** emit to everyone */
    broadcast(notification: StudentNotificationDto): void {
      this.server.emit('new-notification', notification);
    }
  
    /** emit to a specific student */
    sendToStudent(studentId: string, notification: StudentNotificationDto): void {
      this.server.to(studentId).emit('new-notification', notification);
    }
  }
  