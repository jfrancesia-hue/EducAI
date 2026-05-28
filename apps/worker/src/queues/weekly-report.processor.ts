import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";

export interface WeeklyReportJob {
  familyId: string;
  periodStart: string;
  periodEnd: string;
}

/**
 * Job semanal (domingos 20:00 AR) por familia con Premium/Familiar.
 *
 * La lógica completa vive en el API:
 * `apps/api/src/parent-reports/parent-report.service.ts` (WeeklyReportService).
 * Hace agregación de LearningSession + Message + Achievement, llama a Claude
 * (con fallback determinístico), persiste en ParentReport y notifica al adulto
 * responsable por WhatsApp vía Twilio. Email queda como TODO hasta cablear Resend.
 *
 * Mientras el worker no se deploya (ver docs/DEPLOY.md), el disparo es manual:
 * `POST /parent-reports/run-weekly` con un Bearer SUPER_ADMIN. Cuando este
 * processor se reactive, debería hacer una llamada interna a ese mismo endpoint
 * (o importar el service compartido si movemos la lógica a un package común).
 */
@Processor("weekly-report")
export class WeeklyReportProcessor extends WorkerHost {
  private readonly logger = new Logger(WeeklyReportProcessor.name);

  process(job: Job<WeeklyReportJob>): Promise<void> {
    this.logger.log(`weekly-report ${job.id} family=${job.data.familyId}`);
    // TODO: llamar a POST /parent-reports/run-weekly del API con un service key.
    return Promise.resolve();
  }
}
