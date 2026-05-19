import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import { requireUserClaim } from "../auth/require-user-claim.js";
import { Roles } from "../auth/roles.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import { DashboardService } from "./dashboard.service.js";

@ApiTags("dashboard")
@ApiBearerAuth()
@Controller("dashboard")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("institutional")
  @Roles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER")
  getInstitutional(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboard.getInstitutionalOverview({
      role:
        user.role === "SUPER_ADMIN" || user.role === "SCHOOL_ADMIN" || user.role === "TEACHER"
          ? user.role
          : undefined,
      tenantId: requireUserClaim(user, "tenantId"),
      schoolId: user.schoolId,
      teacherId: user.teacherId,
    });
  }

  @Get("ministry")
  @Roles("SUPER_ADMIN", "MINISTRY")
  getMinistry() {
    return this.dashboard.getMinistryOverview();
  }

  @Get("admin-config")
  @Roles("SUPER_ADMIN")
  getAdminConfig() {
    return this.dashboard.getAdminConfigOverview();
  }
}
