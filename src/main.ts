import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const server = app.getHttpServer();
  const options: cors.CorsOptions = {
    origin: true,
    credentials: true,
  };
  app.use(cors(options));
  app.useGlobalPipes(new ValidationPipe({
    whitelist : true,
  }));
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(3000);
}
bootstrap();
