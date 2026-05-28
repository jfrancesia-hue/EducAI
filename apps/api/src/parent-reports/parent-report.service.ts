import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { AnthropicLlmClient, type LlmClient } from "@educai/ai";
import { Prisma } from "@educai/database";

import { PrismaService } from "../prisma/prisma.service.js";
import { TwilioSenderService } from "../whatsapp/tutor/twilio-sender.service.js";

const NARRATIVE_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_TOKENS = 1200;
const NARRATIVE_MODEL = process.env.WEEKLY_REPORT_MODEL?.trim() || "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `Sos ApoyoAI, escribiendo el resumen semanal de uso para una familia.
Tu audiencia son padres o tutores de uno o varios alumnos.
Tu trabajo es traducir los números crudos de la semana (sesiones, minutos, materias trabajadas, logros) a un párrafo cálido y honesto.
Reglas:
- Hablás en español rioplatense, voseo, claro, sin jerga técnica.
- Nunca inventes datos. Si la familia no tuvo actividad, decilo con respeto.
- No leas el contenido textual de los mensajes del alumno: la familia tiene derecho a métricas y resúmenes, no a transcripciones.
- Mantenete entre 2 y 4 oraciones para el mensaje corto; entre 5 y 10 para el resumen ampliado.
- Si hay logros, mencionalos por nombre.
- Si hay desbalances entre materias (ej: 80% matemática, 20% lengua), nombrarlo sin alarmar.`;

export interface WeeklyReportInput {
  familyId: string;
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface WeeklyReportResult {
  reportId: string;
  studentsIncluded: number;
  sentToWhatsapp: number;
  pendingEmail: number;
}

export interface NarrativeOutput {
  shortMessage: string;
  fullText: string;
}

interface StudentAggregation {
  studentName: string;
  grade: number;
  sessionsCompleted: number;
  sessionsTotal: number;
  totalMinutes: number;
  subjectMinutes: Record<string, number>;
  messageCount: number;
  achievements: Array<{ type: string; name: string; description: string }>;
}

const LLM_TOKEN = Symbol("PARENT_REPORT_LLM");

@Injectable()
export class WeeklyReportService {
  private readonly logger = new Logger(WeeklyReportService.name);
  private readonly llmConfigured: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioSender: TwilioSenderService,
    @Optional() @Inject(LLM_TOKEN) private readonly injectedLlm?: LlmClient,
  ) {
    this.llmConfigured = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  }

  static readonly LLM_TOKEN = LLM_TOKEN;

  async generateForFamily(input: WeeklyReportInput): Promise<WeeklyReportResult> {
    if (input.periodStart >= input.periodEnd) {
      throw new InternalServerErrorException({
        code: "WEEKLY_REPORT_INVALID_PERIOD",
        message: "periodStart debe ser anterior a periodEnd",
      });
    }

    const family = await this.prisma.family.findFirst({
      where: {
        id: input.familyId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
      include: {
        parents: { include: { user: { select: { fullName: true } } } },
        students: {
          where: { deletedAt: null },
          include: { profile: true },
        },
      },
    });

    if (!family) {
      throw new NotFoundException({
        code: "WEEKLY_REPORT_FAMILY_NOT_FOUND",
        message: `No se encontró la familia ${input.familyId} dentro del tenant`,
      });
    }

    const studentsWithProfile = family.students.filter((student) => student.profile !== null);

    const aggregations = await Promise.all(
      studentsWithProfile.map((student) =>
        this.aggregateStudent(student.firstName, student.grade, student.profile!.id, input),
      ),
    );

    const narrative = await this.buildNarrative(family.name, aggregations, input);

    const report = await this.prisma.parentReport.create({
      data: {
        tenantId: input.tenantId,
        familyId: input.familyId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        summary: {
          familyName: family.name,
          aggregations,
          narrative,
          generatedAt: new Date().toISOString(),
          llmConfigured: this.llmConfigured,
        } as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    const sentToWhatsapp = await this.notifyParents(
      family.parents,
      report.id,
      family.name,
      narrative.shortMessage,
    );

    if (sentToWhatsapp > 0) {
      await this.prisma.parentReport.update({
        where: { id: report.id },
        data: { sentAt: new Date() },
      });
    }

    this.logger.log({
      event: "weekly_report_generated",
      reportId: report.id,
      familyId: input.familyId,
      studentsIncluded: aggregations.length,
      sentToWhatsapp,
    });

    return {
      reportId: report.id,
      studentsIncluded: aggregations.length,
      sentToWhatsapp,
      // TODO(email): pendiente hasta cablear Resend o equivalente.
      pendingEmail: family.parents.length,
    };
  }

  private async aggregateStudent(
    studentName: string,
    grade: number,
    studentProfileId: string,
    input: WeeklyReportInput,
  ): Promise<StudentAggregation> {
    const periodFilter = {
      gte: input.periodStart,
      lt: input.periodEnd,
    };

    const [sessions, messageCount, achievements] = await Promise.all([
      this.prisma.learningSession.findMany({
        where: {
          studentProfileId,
          createdAt: periodFilter,
        },
        select: { subject: true, durationMinutes: true, completed: true },
      }),
      this.prisma.message.count({
        where: {
          conversation: { studentProfileId },
          createdAt: periodFilter,
        },
      }),
      this.prisma.achievement.findMany({
        where: {
          studentProfileId,
          earnedAt: periodFilter,
        },
        select: { type: true, name: true, description: true },
      }),
    ]);

    const subjectMinutes: Record<string, number> = {};
    let totalMinutes = 0;
    let sessionsCompleted = 0;
    for (const session of sessions) {
      subjectMinutes[session.subject] =
        (subjectMinutes[session.subject] ?? 0) + session.durationMinutes;
      totalMinutes += session.durationMinutes;
      if (session.completed) sessionsCompleted += 1;
    }

    return {
      studentName,
      grade,
      sessionsCompleted,
      sessionsTotal: sessions.length,
      totalMinutes,
      subjectMinutes,
      messageCount,
      achievements,
    };
  }

  private async buildNarrative(
    familyName: string,
    aggregations: StudentAggregation[],
    input: WeeklyReportInput,
  ): Promise<NarrativeOutput> {
    if (aggregations.length === 0) {
      return {
        shortMessage: `Esta semana no registramos actividad de aprendizaje en la familia ${familyName}. Si querés que arranquen, escribiles desde el WhatsApp registrado.`,
        fullText: `Hola familia ${familyName}: durante la semana del ${input.periodStart.toISOString().slice(0, 10)} al ${input.periodEnd.toISOString().slice(0, 10)} no registramos actividad de aprendizaje con ApoyoAI. Si necesitan ayuda para retomar el ritmo, podemos coordinar un acompañamiento.`,
      };
    }

    if (!this.llmConfigured && !this.injectedLlm) {
      return this.deterministicNarrative(familyName, aggregations, input);
    }

    const llm = this.injectedLlm ?? this.buildLlm();
    try {
      const userPrompt = this.buildUserPrompt(familyName, aggregations, input);
      const completion = await llm.generate({
        model: NARRATIVE_MODEL,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
        maxTokens: MAX_OUTPUT_TOKENS,
        responseFormat: "json",
      });
      const parsed = this.parseNarrative(completion.content);
      if (parsed) return parsed;
      this.logger.warn({
        event: "weekly_report_narrative_parse_failed",
        rawLength: completion.content.length,
      });
    } catch (error) {
      this.logger.warn({
        event: "weekly_report_narrative_llm_failed",
        errorMessage: error instanceof Error ? error.message : "unknown",
      });
    }

    return this.deterministicNarrative(familyName, aggregations, input);
  }

  private buildLlm(): LlmClient {
    return new AnthropicLlmClient({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeoutMs: NARRATIVE_TIMEOUT_MS,
    });
  }

  private buildUserPrompt(
    familyName: string,
    aggregations: StudentAggregation[],
    input: WeeklyReportInput,
  ): string {
    const lines = [
      `Familia: ${familyName}`,
      `Período: ${input.periodStart.toISOString().slice(0, 10)} → ${input.periodEnd.toISOString().slice(0, 10)}`,
      "",
      "Datos por estudiante:",
    ];

    for (const agg of aggregations) {
      lines.push(
        `- ${agg.studentName} (${agg.grade}° grado):`,
        `  * Sesiones: ${agg.sessionsCompleted}/${agg.sessionsTotal} completadas`,
        `  * Minutos totales: ${agg.totalMinutes}`,
        `  * Materias trabajadas: ${this.formatSubjects(agg.subjectMinutes)}`,
        `  * Mensajes intercambiados: ${agg.messageCount}`,
        `  * Logros: ${agg.achievements.length === 0 ? "ninguno esta semana" : agg.achievements.map((a) => a.name).join(", ")}`,
      );
    }

    lines.push(
      "",
      "Devolveme un JSON con exactamente esta forma:",
      '{"shortMessage": "string", "fullText": "string"}',
      "Nada más. Sin markdown, sin código, sin comentarios.",
    );

    return lines.join("\n");
  }

  private formatSubjects(subjectMinutes: Record<string, number>): string {
    const entries = Object.entries(subjectMinutes).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return "sin sesiones registradas";
    return entries.map(([subject, minutes]) => `${subject} (${minutes}min)`).join(", ");
  }

  private parseNarrative(raw: string): NarrativeOutput | null {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/iu, "")
      .replace(/\s*```$/u, "");
    try {
      const parsed: unknown = JSON.parse(cleaned);
      if (!parsed || typeof parsed !== "object") return null;
      const obj = parsed as Record<string, unknown>;
      const shortMessage = typeof obj.shortMessage === "string" ? obj.shortMessage.trim() : "";
      const fullText = typeof obj.fullText === "string" ? obj.fullText.trim() : "";
      if (!shortMessage || !fullText) return null;
      return { shortMessage, fullText };
    } catch {
      return null;
    }
  }

  private deterministicNarrative(
    familyName: string,
    aggregations: StudentAggregation[],
    input: WeeklyReportInput,
  ): NarrativeOutput {
    const totalMinutes = aggregations.reduce((acc, agg) => acc + agg.totalMinutes, 0);
    const totalSessions = aggregations.reduce((acc, agg) => acc + agg.sessionsTotal, 0);
    const totalAchievements = aggregations.reduce((acc, agg) => acc + agg.achievements.length, 0);

    const names = aggregations.map((agg) => agg.studentName);
    const subjectList = this.combinedSubjects(aggregations);
    const periodLabel = `del ${input.periodStart.toISOString().slice(0, 10)} al ${input.periodEnd.toISOString().slice(0, 10)}`;

    const shortMessage = `Familia ${familyName}: esta semana ${this.joinNames(names)} sumaron ${totalMinutes} minutos en ${totalSessions} sesiones${totalAchievements ? ` y ${totalAchievements} logro(s)` : ""}.`;
    const fullText = `Hola familia ${familyName}: durante la semana ${periodLabel}, ${this.joinNames(names)} acumularon ${totalMinutes} minutos de aprendizaje en ${totalSessions} sesiones${subjectList ? ` repartidos entre ${subjectList}` : ""}.${totalAchievements ? ` Sumaron ${totalAchievements} logro(s) en el camino — bien por ellos.` : " Si querés que la semana próxima sume más actividad, escribinos."}`;

    return { shortMessage, fullText };
  }

  private combinedSubjects(aggregations: StudentAggregation[]): string {
    const totals: Record<string, number> = {};
    for (const agg of aggregations) {
      for (const [subject, minutes] of Object.entries(agg.subjectMinutes)) {
        totals[subject] = (totals[subject] ?? 0) + minutes;
      }
    }
    const sorted = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([subject]) => subject);
    return sorted.join(", ");
  }

  private joinNames(names: string[]): string {
    if (names.length === 0) return "";
    if (names.length === 1) return names[0]!;
    if (names.length === 2) return `${names[0]} y ${names[1]}`;
    return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
  }

  private async notifyParents(
    parents: Array<{ id: string; phone: string | null; user: { fullName: string } | null }>,
    reportId: string,
    familyName: string,
    shortMessage: string,
  ): Promise<number> {
    let sent = 0;
    const portalUrl =
      process.env.APOYOAI_FAMILY_PORTAL_URL ?? "https://apoyoai.com.ar/familia/reportes";
    const body = `${shortMessage}\n\nResumen completo: ${portalUrl}/${reportId}`;

    for (const parent of parents) {
      if (!parent.phone?.trim()) continue;
      try {
        await this.twilioSender.send({ toWhatsappPhone: parent.phone, body });
        sent += 1;
      } catch (error) {
        this.logger.warn({
          event: "weekly_report_notify_failed",
          parentId: parent.id,
          familyName,
          errorMessage: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    return sent;
  }
}
