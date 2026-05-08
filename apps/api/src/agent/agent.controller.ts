import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/authenticated-user.decorator.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { AuthenticatedUser } from "../auth/types.js";
import { RateLimitGuard } from "../common/rate-limit/rate-limit.guard.js";
import { RunAgentDto } from "./dto/run-agent.dto.js";
import { AgentService } from "./agent.service.js";

@ApiTags("agent")
@ApiBearerAuth()
@Controller("agent")
@UseGuards(JwtAuthGuard, RateLimitGuard)
export class AgentController {
  constructor(private readonly agent: AgentService) {}

  @Post("run")
  @ApiOkResponse({ description: "Resultado del agente docente" })
  async run(@Body() dto: RunAgentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.agent.run(dto, user);
  }
}
