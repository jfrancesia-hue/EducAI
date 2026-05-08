import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
import { PrismaHealthIndicator } from "./prisma.health.js";

@ApiTags("health")
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
  ) {}

  @Get("health")
  @ApiOkResponse({ description: "Liveness — el proceso esta vivo" })
  liveness() {
    return {
      status: "ok",
      service: "educai-api",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("readiness")
  @ApiOkResponse({ description: "Readiness — dependencias criticas disponibles" })
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.prisma.pingCheck("database")]);
  }
}
