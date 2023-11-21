import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
// import * as cookieParser from 'cookie-parser';

const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({ origin: true, credentials: true });
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(3000);
}
bootstrap();
