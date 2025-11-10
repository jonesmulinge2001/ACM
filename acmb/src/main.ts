/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Only initialize Redis adapter if REDIS_URL exists
  if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    const ioAdapter = new IoAdapter(app);
    (ioAdapter as any).createIOServer = (server: any, options?: any) => {
      const io = require('socket.io')(server, options); // attach to HTTP server
      io.adapter(createAdapter(pubClient, subClient));
      return io;
    };
    app.useWebSocketAdapter(ioAdapter);
    console.log('Redis adapter configured for Socket.IO');
  }

  app.enableCors({
    origin: ['https://acm-ldq1.vercel.app', 'http://localhost:4200'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}

bootstrap().catch(err => {
  console.error('Error starting application:', err);
  process.exit(1);
});

