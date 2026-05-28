import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/roles.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import { RunWeeklyReportDto } from "./dto/run-weekly-report.dto.js";
import { WeeklyReportService } from "./parent-report.service.js";

/**
 * Endpoint admin para disparar manualmente un reporte semanal de familia.
 *
 * En esta fase ApoyoAI todavía no tiene el worker BullMQ deployado (ver
 * docs/DEPLOY.md), así que la corrida automática semanal todavía no existe.
 * Este endpoint sirve para:
 *
 * 1. Operación manual (soporte / QA) mientras el worker está apagado.
 * 2. Disparo desde un cron externo (Render Cron Job, GitHub Actions schedule,
 *    Vercel Cron) que apunte a este endpoint con un Bearer SUPER_ADMIN.
 * 3. El processor de `apps/worker/src/queues/weekly-report.processor.ts`,
 *    cuando se reactive, debería terminar llamando a este mismo service.
 */
@ApiTags("parent-reports")
@ApiBearerAuth()
@Controller("parent-reports")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN")
export class ParentReportController {
  constructor(private readonly weeklyReports: WeeklyReportService) {}

  @Post("run-weekly")
  async runWeekly(@Body() body: RunWeeklyReportDto) {
    const result = await this.weeklyReports.generateForFamily({
      familyId: body.familyId,
      tenantId: body.tenantId,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
    });
    return { data: result };
  }
}
