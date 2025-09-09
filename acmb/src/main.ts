/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // create redis clients and attach adapter (only when REDIS_URL provided)
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    // @ts-ignore set adapter on underlying io server after listening
    const server = app.getHttpServer();
    // Adapter needs the server instance later, so use IoAdapter
    const ioAdapter = new IoAdapter(app);
    // attach adapter factory to adapter
    (ioAdapter as any).createIOServer = (port: number, options?: any) => {
      const io = require('socket.io')(port, options);
      io.adapter(createAdapter(pubClient, subClient));
      return io;
    };

    app.useWebSocketAdapter(ioAdapter);
    console.log('Redis adapter configured for Socket.IO');
  }

  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();