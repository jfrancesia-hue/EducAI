import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import { requireUserClaim } from "../auth/require-user-claim.js";
import { Roles } from "../auth/roles.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import { CloseHandoffDto } from "./dto/close-handoff.dto.js";
import { HandoffService } from "./handoff.service.js";

@ApiTags("handoffs")
@ApiBearerAuth()
@Controller("handoffs")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles("MINISTRY", "SUPER_ADMIN")
export class HandoffController {
  constructor(private readonly handoffs: HandoffService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.handoffs.listOpen(requireUserClaim(user, "tenantId"));
  }

  @Patch(":id/close")
  close(
    @Param("id") id: string,
    @Body() body: CloseHandoffDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.handoffs.close({
      tenantId: requireUserClaim(user, "tenantId"),
      handoffId: id,
      resolvedBy: user.email ?? user.id,
      resolutionNote: body.resolutionNote,
    });
  }
}
