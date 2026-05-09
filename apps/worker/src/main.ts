import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { initSentry } from "./common/observability/sentry.js";

async function bootstrap() {
  initSentry("educai-worker");

  const app = await NestFactory.create(AppModule, { cors: false });
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 4200);
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
