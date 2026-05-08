import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import express from "express";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter.js";
import { AppLogger } from "./common/logger/app-logger.service.js";
import { initSentry } from "./common/observability/sentry.js";
import { RateLimitGuard } from "./common/rate-limit/rate-limit.guard.js";
import { RequestIdMiddleware } from "./common/request-id/request-id.middleware.js";
import { securityHeadersMiddleware } from "./common/security/security-headers.middleware.js";
import { getAllowedOrigins, validateRuntimeEnv } from "./config/env.js";

async function bootstrap() {
  validateRuntimeEnv();
  initSentry("educai-api");

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const requestId = new RequestIdMiddleware();
  app.use(requestId.use.bind(requestId));

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(securityHeadersMiddleware);
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));

  app.setGlobalPrefix("api/v1", {
    exclude: ["health", "readiness"],
  });

  app.enableCors({
    origin: getAllowedOrigins(),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalGuards(app.get(RateLimitGuard));
  app.useGlobalFilters(new GlobalExceptionFilter(app.get(AppLogger)));

  app.enableShutdownHooks();

  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("EducAI API")
      .setDescription("API multi-tenant para EducAI LATAM y ApoyoAI.")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();

    SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
