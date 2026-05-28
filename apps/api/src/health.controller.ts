import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOkResponse({ description: "API disponible" })
  getHealth() {
    return {
      data: {
        status: "ok",
        service: "educai-api",
        commit:
          process.env.RENDER_GIT_COMMIT ??
          process.env.RAILWAY_GIT_COMMIT_SHA ??
          process.env.VERCEL_GIT_COMMIT_SHA ??
          null,
        lessonGuideSchema: "educai.lesson-guide.v1",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
