/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

let server: any;

export async function createNestServer() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['https://acm-ldq1.vercel.app', 'http://localhost:4200'],
    credentials: true,
  });

  await app.init();
  return app;
}

// ---- LOCAL MODE: runs only when not in serverless ----
if (!process.env.VERCEL) {
  createNestServer().then(app => {
    const port = process.env.PORT ?? 3000;
    app.listen(port);
    console.log(`🚀 Local server running on http://localhost:${port}`);
  });
}

// ---- SERVERLESS MODE (Vercel) ----
export default async function handler(req: any, res: any) {
  if (!server) {
    const app = await createNestServer();
    server = app.getHttpAdapter().getInstance();
  }
  return server(req, res);
}
