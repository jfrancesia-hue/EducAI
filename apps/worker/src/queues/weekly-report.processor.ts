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
 * Fase 1 implementara: agregacion de LearningSession + Message + Achievement,
 * generacion de resumen narrativo con Claude, persistencia en ParentReport,
 * envio por email (React Email + Resend) y WhatsApp (Twilio).
 */
@Processor("weekly-report")
export class WeeklyReportProcessor extends WorkerHost {
  private readonly logger = new Logger(WeeklyReportProcessor.name);

  process(job: Job<WeeklyReportJob>): Promise<void> {
    this.logger.log(`weekly-report ${job.id} family=${job.data.familyId}`);
    // Implementacion completa en Fase 1.
    return Promise.resolve();
  }
}
