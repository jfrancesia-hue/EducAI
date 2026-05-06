import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { RateLimitGuard } from "./common/rate-limit/rate-limit.guard.js";
import { securityHeadersMiddleware } from "./common/security/security-headers.middleware.js";
import { getAllowedOrigins, validateRuntimeEnv } from "./config/env.js";

async function bootstrap() {
  validateRuntimeEnv();

  const app = await NestFactory.create(AppModule);
  app.use(securityHeadersMiddleware);
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
