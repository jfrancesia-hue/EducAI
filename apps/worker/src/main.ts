import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { requireWorkerProductionEnv } from "./env/require-production-env.js";

async function bootstrap() {
  requireWorkerProductionEnv(process.env);
  const app = await NestFactory.create(AppModule, { cors: false });
  const port = Number(process.env.PORT ?? 4200);
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
