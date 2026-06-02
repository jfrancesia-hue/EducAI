import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NextFunction, Request, Response } from "express";
import { json, urlencoded } from "express";
import { requireApiProductionEnv } from "./env/require-production-env.js";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  requireApiProductionEnv(process.env);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.disable("x-powered-by");
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ?? "http://localhost:3000,http://localhost:3100"
  )
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    );
    next();
  });
  app.use(urlencoded({ extended: false, limit: "1mb" }));
  app.use(json({ limit: "1mb" }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const isProduction = process.env.NODE_ENV === "production";
  const swaggerEnabled = !isProduction || process.env.ENABLE_SWAGGER_DOCS?.trim() === "true";
  if (swaggerEnabled) {
    // En producción, /docs nunca se expone sin protección: exige basic-auth
    // (SWAGGER_BASIC_AUTH="usuario:clave"). Sin credenciales, no se monta (fail-closed).
    const basicAuth = process.env.SWAGGER_BASIC_AUTH?.trim();
    if (isProduction && !basicAuth) {
      console.warn(
        "[api] ENABLE_SWAGGER_DOCS=true pero falta SWAGGER_BASIC_AUTH: no se expone /docs en produccion",
      );
    } else {
      if (isProduction && basicAuth) {
        const expected = `Basic ${Buffer.from(basicAuth).toString("base64")}`;
        app.use("/docs", (req: Request, res: Response, next: NextFunction) => {
          if (req.headers.authorization === expected) {
            next();
            return;
          }
          res.setHeader("WWW-Authenticate", 'Basic realm="EducAI API docs"');
          res.status(401).send("Autenticacion requerida");
        });
      }

      const config = new DocumentBuilder()
        .setTitle("EducAI API")
        .setDescription("API multi-tenant para EducAI LATAM y ApoyoAI.")
        .setVersion("0.1.0")
        .addBearerAuth()
        .build();

      SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
    }
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
