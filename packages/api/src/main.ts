import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.useLogger(['log', 'error', 'warn', 'debug']);
  app.setGlobalPrefix('api');

  // CORS — allow the Vite console and Expo dev client
  app.enableCors({
    origin: (config.get('CORS_ORIGIN') || 'http://localhost:5163').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Helmet for security headers (relaxed for Swagger UI)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Global validation pipe — strips unknown props, validates DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger / OpenAPI at /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CEWERS API')
    .setDescription('Conflict Early Warning & Early Response System — Benue South')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('API_PORT', 4000);
  await app.listen(port);

  const url = await app.getUrl();
  Logger.log(`🚀 CEWERS API running on   ${url}/api`, 'Bootstrap');
  Logger.log(`📖 Swagger docs at         ${url}/api/docs`, 'Bootstrap');
}

bootstrap();
