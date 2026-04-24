import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";

export interface DiagnosticAnalysisJob {
  studentProfileId: string;
  answers: Array<{ questionId: string; answer: string; correct: boolean }>;
}

/**
 * Procesa el diagnostico adaptativo al finalizar la evaluacion inicial.
 * Fase 1 implementara: analisis por competencia, generacion del informe
 * narrativo del diagnostico (Claude), escritura en StudentProfile.diagnosticScore,
 * notificacion al padre.
 */
@Processor("diagnostic-analysis")
export class DiagnosticAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(DiagnosticAnalysisProcessor.name);

  async process(job: Job<DiagnosticAnalysisJob>): Promise<void> {
    this.logger.log(
      `diagnostic-analysis ${job.id} profile=${job.data.studentProfileId}`,
    );
    // Implementacion completa en Fase 1.
  }
}
