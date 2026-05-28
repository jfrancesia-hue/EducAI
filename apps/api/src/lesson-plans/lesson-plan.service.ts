import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  AnthropicLlmClient,
  EDUCAI_LIMITS,
  PlanGeneratorAgent,
  normalizeEducAIPlan,
  type LessonPlanGenerationResult,
} from "@educai/ai";
import { Prisma } from "@educai/database";
import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import { ImageEnrichmentService } from "../media/image-enrichment.service.js";
import { VideoEnrichmentService } from "../media/video-enrichment.service.js";
import type { ImagenRef, VideoRef } from "../media/types.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { TeacherCourseService } from "../teacher-courses/teacher-course.service.js";
import type { LessonPlanFeedbackDto } from "./dto/lesson-plan-feedback.dto.js";

type PrismaTx = Prisma.TransactionClient;
const DEFAULT_LESSON_PLAN_ANTHROPIC_TIMEOUT_MS = 390_000;

export type LessonPlanStatus = "pending" | "running" | "ready" | "failed" | "draft";

type GenerateInput = {
  tenantId: string;
  teacherId: string;
  plan?: string;
  educationLevel: "primaria" | "secundaria" | "terciario" | "universitario";
  grade: number;
  subject: string;
  courseLabel?: string;
  institutionName?: string;
  lessonIntent?: string;
  levelContext?: string;
  plannedDate?: string;
  careerName?: string;
  topic: string;
  sessionCount: number;
  totalDurationMinutes: number;
  learningGoal?: string;
  groupProfile?: string;
  priorKnowledge?: string;
  curriculumContext?: string;
  availableResources?: string;
  assessmentFocus?: string;
  inclusionNeeds?: string;
  outputFormat?: string;
  courseId?: string;
};

@Injectable()
export class LessonPlanService {
  private readonly logger = new Logger(LessonPlanService.name);
  private readonly generator: PlanGeneratorAgent;
  private readonly aiProviderConfigured: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly teacherCourses: TeacherCourseService,
    private readonly imageEnrichment: ImageEnrichmentService,
    private readonly videoEnrichment: VideoEnrichmentService,
  ) {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();
    this.aiProviderConfigured = Boolean(anthropicApiKey);
    this.generator = anthropicApiKey
      ? new PlanGeneratorAgent(
          new AnthropicLlmClient({
            apiKey: anthropicApiKey,
            timeoutMs: this.readPositiveIntegerEnv(
              "LESSON_PLAN_ANTHROPIC_TIMEOUT_MS",
              DEFAULT_LESSON_PLAN_ANTHROPIC_TIMEOUT_MS,
            ),
          }),
        )
      : new PlanGeneratorAgent();
  }

  async resolveTeacherIdForPlanning(user: AuthenticatedUser) {
    if (user.teacherId) {
      return user.teacherId;
    }

    if (user.role !== "SCHOOL_ADMIN") {
      throw new ForbiddenException({
        code: "TEACHERID_CONTEXT_MISSING",
        message: "Falta el claim teacherId en la sesion autenticada",
      });
    }

    if (!user.tenantId) {
      throw new ForbiddenException({
        code: "TENANTID_CONTEXT_MISSING",
        message: "Falta el claim tenantId en la sesion autenticada",
      });
    }

    if (!user.schoolId) {
      throw new ForbiddenException({
        code: "SCHOOLID_CONTEXT_MISSING",
        message: "Falta el claim schoolId en la sesion autenticada",
      });
    }

    try {
      const existingTeacher = await this.prisma.teacher.findFirst({
        where: {
          tenantId: user.tenantId,
          schoolId: user.schoolId,
          deletedAt: null,
        },
        orderBy: { createdAt: "asc" },
      });

      if (!existingTeacher) {
        throw new ForbiddenException({
          code: "TEACHER_PROFILE_MISSING",
          message: "La escuela no tiene un perfil docente disponible para guardar la clase",
        });
      }

      return existingTeacher.id;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException({
        code: "PLANNER_PROFILE_FAILED",
        message: "No se pudo preparar el perfil docente para generar la clase",
        detail: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  async generate(input: GenerateInput) {
    await this.assertCanGenerateLessonPlan({
      tenantId: input.tenantId,
      teacherId: input.teacherId,
      plan: input.plan,
    });

    const enrichedInput = await this.enrichWithCourseContext(input);

    const created = await this.createPending(enrichedInput);

    // La generación corre en background: el cliente recibe `{id, status: "pending"}`
    // de inmediato y polea `GET /lesson-plans/:id` hasta que el status sea "ready" o
    // "failed". `runGeneration` captura todos los errores y nunca propaga.
    void this.runGeneration(created.id, enrichedInput);

    return { data: { id: created.id, status: "pending" as const } };
  }

  /**
   * Si el docente eligió un curso (`courseId`), cargamos su contexto y mergeamos
   * con el input del form. El input del form siempre gana: solo completamos los
   * campos que vinieron vacíos. Esto motiva al docente a cargar sus cursos sin
   * pisarle lo que escriba manualmente.
   */
  private async enrichWithCourseContext(input: GenerateInput): Promise<GenerateInput> {
    if (!input.courseId) {
      return input;
    }

    const course = await this.teacherCourses.getContextForLlm(input.courseId, {
      tenantId: input.tenantId,
      teacherId: input.teacherId,
    });

    if (!course) {
      // Curso inválido o de otro docente: lo ignoramos en silencio para no
      // bloquear la generación. El frontend ya valida ownership con `GET /teacher-courses`.
      this.logger.warn({
        event: "lesson_plan_course_context_missing",
        courseId: input.courseId,
        teacherId: input.teacherId,
      });
      return { ...input, courseId: undefined };
    }

    const studentCountHint =
      typeof course.studentCount === "number" ? `${course.studentCount} estudiantes` : undefined;
    const shiftHint = course.shift ? `turno ${course.shift}` : undefined;
    const baseGroupProfile = [course.name, studentCountHint, shiftHint].filter(Boolean).join(", ");
    // Si el docente cargó un perfil pedagógico en el curso, lo prepende al hint estructural.
    const groupProfileFromCourse = course.groupProfile
      ? `${course.groupProfile}${baseGroupProfile ? ` (${baseGroupProfile})` : ""}`
      : baseGroupProfile;

    return {
      ...input,
      courseLabel: input.courseLabel ?? course.name,
      // Si el form no trajo materia (no debería pasar, es required), tomamos la del curso.
      subject: input.subject || course.subject,
      institutionName: input.institutionName ?? course.institutionName ?? undefined,
      groupProfile: input.groupProfile ?? (groupProfileFromCourse || undefined),
      priorKnowledge: input.priorKnowledge ?? course.priorKnowledge ?? undefined,
      availableResources: input.availableResources ?? course.availableResources ?? undefined,
      inclusionNeeds: input.inclusionNeeds ?? course.inclusionNotes ?? undefined,
    };
  }

  private buildPlanningContext(input: GenerateInput): Record<string, string | undefined> {
    return {
      educationLevel: input.educationLevel,
      courseLabel: input.courseLabel,
      institutionName: input.institutionName,
      lessonIntent: input.lessonIntent,
      levelContext: input.levelContext,
      plannedDate: input.plannedDate,
      careerName: input.careerName,
      learningGoal: input.learningGoal,
      groupProfile: input.groupProfile,
      priorKnowledge: input.priorKnowledge,
      curriculumContext: input.curriculumContext,
      availableResources: input.availableResources,
      assessmentFocus: input.assessmentFocus,
      inclusionNeeds: input.inclusionNeeds,
      outputFormat: input.outputFormat,
    };
  }

  private async createPending(input: GenerateInput): Promise<{ id: string }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.enableRlsBypass(tx);

        return tx.lessonPlan.create({
          data: {
            tenantId: input.tenantId,
            teacherId: input.teacherId,
            grade: input.grade,
            subject: input.subject,
            topic: input.topic,
            durationMinutes: input.totalDurationMinutes,
            competences: [],
            objectives: [],
            activities: [],
            resources: [],
            assessment: {},
            adaptations: {
              planningContext: this.buildPlanningContext(input),
            },
            status: "pending",
            generatedByAI: false,
          },
          select: { id: true },
        });
      });
    } catch (error) {
      throw new InternalServerErrorException({
        code: "LESSON_PLAN_QUEUE_FAILED",
        message: "No se pudo encolar la generacion de la guia",
        detail: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  async runGeneration(lessonPlanId: string, input: GenerateInput): Promise<void> {
    const startedAt = Date.now();
    try {
      await this.updateStatus(lessonPlanId, "running");

      const generation = await this.generator.generateWithMetadata(input);
      const elapsedMs = Date.now() - startedAt;

      if (generation.source === "fallback") {
        this.logger.warn({
          event: "lesson_plan_generation_fallback",
          lessonPlanId,
          reason: generation.fallbackReason,
          attempts: generation.fallbackDetails,
          elapsedMs,
          aiProviderConfigured: this.aiProviderConfigured,
        });

        if (!this.shouldPersistFallbackPlans()) {
          await this.markFailed(
            lessonPlanId,
            "LESSON_PLAN_AI_UNAVAILABLE",
            generation.fallbackReason ?? "llm_unavailable",
          );
          return;
        }
      }

      await this.completeWithPlan(lessonPlanId, generation);

      this.logger.log({
        event: "lesson_plan_generation_completed",
        lessonPlanId,
        source: generation.source,
        elapsedMs,
        generatedByAI: generation.source === "llm",
        subject: input.subject,
        topic: input.topic,
        educationLevel: input.educationLevel,
        grade: input.grade,
      });
    } catch (error) {
      const elapsedMs = Date.now() - startedAt;
      const errorName = error instanceof Error ? error.name : "Unknown";
      const errorMessage = error instanceof Error ? error.message : "unknown";
      this.logger.error({
        event: "lesson_plan_generation_failed",
        lessonPlanId,
        elapsedMs,
        errorName,
        errorMessage,
      });
      await this.markFailed(lessonPlanId, "LESSON_PLAN_GENERATION_FAILED", errorMessage);
    }
  }

  private async updateStatus(lessonPlanId: string, status: LessonPlanStatus): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);
      await tx.lessonPlan.update({
        where: { id: lessonPlanId },
        data: { status },
      });
    });
  }

  private async markFailed(lessonPlanId: string, code: string, reason: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.enableRlsBypass(tx);
        const existing = await tx.lessonPlan.findUnique({
          where: { id: lessonPlanId },
          select: { adaptations: true },
        });
        const adaptations = this.asJsonObject(existing?.adaptations ?? null);
        await tx.lessonPlan.update({
          where: { id: lessonPlanId },
          data: {
            status: "failed",
            adaptations: {
              ...adaptations,
              error: { code, reason, failedAt: new Date().toISOString() },
            },
          },
        });
      });
    } catch (error) {
      this.logger.error({
        event: "lesson_plan_mark_failed_failed",
        lessonPlanId,
        errorMessage: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  private async completeWithPlan(
    lessonPlanId: string,
    generation: LessonPlanGenerationResult,
  ): Promise<void> {
    const plan = generation.plan;
    const enrichedGuide = await this.enrichGuideMedia(plan.guide, lessonPlanId);
    await this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);
      const existing = await tx.lessonPlan.findUnique({
        where: { id: lessonPlanId },
        select: { adaptations: true },
      });
      const adaptations = this.asJsonObject(existing?.adaptations ?? null);
      await tx.lessonPlan.update({
        where: { id: lessonPlanId },
        data: {
          competences: plan.competences,
          objectives: plan.objectives,
          activities: plan.sessions,
          resources: plan.sessions.flatMap((session) => session.resources),
          assessment: plan.assessment,
          adaptations: {
            ...adaptations,
            differentiation: plan.sessions.map((session) => ({
              session: session.number,
              differentiation: session.differentiation,
            })),
            overview: plan.overview,
            printables: plan.printables,
            guide: enrichedGuide,
          },
          status: "ready",
          generatedByAI: generation.source === "llm",
        },
      });
    });
  }

  /**
   * El LLM devuelve refs abstractas de imágenes y videos (titulo + busqueda).
   * Acá las resolvemos a URLs reales contra Pexels/Unsplash/YouTube antes de
   * persistirlas, así el detalle de la guía las puede renderear directo.
   * Fail-soft: cualquier error de las APIs externas se loggea y la guía
   * queda con la ref sin URL — el frontend muestra placeholder.
   */
  private async enrichGuideMedia<
    G extends {
      recursosDidacticos?: {
        imagenesSugeridas?: Array<Record<string, unknown>>;
        videosSugeridos?: Array<Record<string, unknown>>;
      };
    },
  >(guide: G, lessonPlanId: string): Promise<G> {
    if (!guide?.recursosDidacticos) return guide;
    const { imagenesSugeridas, videosSugeridos } = guide.recursosDidacticos;

    const readString = (value: unknown): string => (typeof value === "string" ? value : "");

    try {
      const imageRefs: ImagenRef[] = (imagenesSugeridas ?? []).map((entry) => ({
        tipo: "unsplash",
        query: readString(entry.busquedaSugerida),
        orientacion: "horizontal",
        alt: readString(entry.titulo) || readString(entry.descripcion),
      }));

      const videoRefs: VideoRef[] = (videosSugeridos ?? []).map((entry) => ({
        titulo: readString(entry.titulo),
        queryBusqueda: readString(entry.busquedaYoutube),
        resumen: typeof entry.criterioSeleccion === "string" ? entry.criterioSeleccion : undefined,
      }));

      const [enrichedImages, enrichedVideos] = await Promise.all([
        this.imageEnrichment.enrichAll(imageRefs),
        this.videoEnrichment.enrichAll(videoRefs),
      ]);

      const mergedImages = (imagenesSugeridas ?? []).map((entry, index) => {
        const enriched = enrichedImages[index];
        if (!enriched) return entry;
        return {
          ...entry,
          urls: enriched.urls,
          autor: enriched.autor,
          attribution: enriched.attribution,
          proveedor: enriched.urls ? enriched.tipo : undefined,
          downloadLocation: enriched.downloadLocation,
        };
      });

      const mergedVideos = (videosSugeridos ?? []).map((entry, index) => {
        const enriched = enrichedVideos[index];
        if (!enriched) return entry;
        return {
          ...entry,
          embedId: enriched.embedId,
          urlEmbed: enriched.urlEmbed,
          urlBusqueda: enriched.urlBusqueda,
          thumbnail: enriched.thumbnail,
          verificado: enriched.verificado,
        };
      });

      this.logger.log({
        event: "lesson_plan_media_enriched",
        lessonPlanId,
        imagesAttempted: imageRefs.length,
        imagesResolved: enrichedImages.filter((image) => Boolean(image.urls)).length,
        videosAttempted: videoRefs.length,
        videosVerified: enrichedVideos.filter((video) => video.verificado).length,
      });

      return {
        ...guide,
        recursosDidacticos: {
          ...guide.recursosDidacticos,
          imagenesSugeridas: mergedImages,
          videosSugeridos: mergedVideos,
        },
      };
    } catch (error) {
      this.logger.warn({
        event: "lesson_plan_media_enrichment_failed",
        lessonPlanId,
        errorMessage: error instanceof Error ? error.message : "unknown",
      });
      return guide;
    }
  }

  private async assertCanGenerateLessonPlan(input: {
    tenantId: string;
    teacherId: string;
    plan?: string;
  }): Promise<void> {
    const quota = this.resolveLessonPlanQuota(input.plan);
    if (!quota) {
      return;
    }

    const usage = await this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);

      const [used, credits] = await Promise.all([
        tx.lessonPlan.count({
          where: {
            tenantId: input.tenantId,
            teacherId: input.teacherId,
            deletedAt: null,
            // Una generación que terminó en `failed` no le consume crédito al docente.
            // Pending/running/ready/draft sí cuentan: el crédito queda reservado mientras
            // el sistema está trabajando para devolverle la guía.
            status: { not: "failed" },
            ...(quota.periodStart ? { createdAt: { gte: quota.periodStart } } : {}),
          },
        }),
        tx.usageCreditLedger.aggregate({
          _sum: { amount: true },
          where: {
            tenantId: input.tenantId,
            product: "EDUCAI",
            unit: "lesson_plan",
            OR: [{ teacherId: input.teacherId }, { teacherId: null }],
            AND: [
              {
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
            ],
          },
        }),
      ]);

      return {
        used,
        extraCredits: Math.max(0, credits._sum.amount ?? 0),
      };
    });

    const effectiveLimit = quota.limit + usage.extraCredits;
    if (usage.used >= effectiveLimit) {
      throw new ForbiddenException({
        code: "LESSON_PLAN_QUOTA_EXCEEDED",
        message:
          quota.period === "lifetime"
            ? `Alcanzaste el limite Free de ${quota.limit} planificaciones.`
            : `Alcanzaste el limite mensual de ${quota.limit} planificaciones para tu plan.`,
        plan: quota.plan,
        baseLimit: quota.limit,
        extraCredits: usage.extraCredits,
        limit: effectiveLimit,
        used: usage.used,
        period: quota.period,
      });
    }
  }

  private resolveLessonPlanQuota(plan: string | undefined): {
    plan: string;
    limit: number;
    period: "lifetime" | "monthly";
    periodStart?: Date;
  } | null {
    const normalizedPlan = normalizeEducAIPlan(plan);
    const limits = EDUCAI_LIMITS[normalizedPlan];

    if ("planificaciones" in limits) {
      const lessonPlanLimit = limits.planificaciones;
      if ("total_vida" in lessonPlanLimit) {
        return {
          plan: normalizedPlan,
          limit: lessonPlanLimit.total_vida,
          period: "lifetime",
        };
      }

      if (lessonPlanLimit.mensual === null) {
        return null;
      }

      return {
        plan: normalizedPlan,
        limit: lessonPlanLimit.mensual,
        period: "monthly",
        periodStart: this.currentMonthStart(),
      };
    }

    if ("planificaciones_por_docente_activo" in limits) {
      return {
        plan: normalizedPlan,
        limit: limits.planificaciones_por_docente_activo.mensual,
        period: "monthly",
        periodStart: this.currentMonthStart(),
      };
    }

    return null;
  }

  private currentMonthStart(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  private shouldPersistFallbackPlans(): boolean {
    return (
      process.env.ALLOW_LESSON_PLAN_FALLBACK === "true" || process.env.NODE_ENV !== "production"
    );
  }

  private readPositiveIntegerEnv(name: string, fallback: number): number {
    const value = Number.parseInt(process.env[name] ?? "", 10);
    return Number.isFinite(value) && value > 0 ? Math.max(value, fallback) : fallback;
  }

  private async enableRlsBypass(tx: PrismaTx): Promise<void> {
    await tx.$executeRawUnsafe("SELECT set_config('app.bypass_rls', 'true', true)");
  }

  async findOne(id: string, access: { tenantId: string; teacherId?: string; schoolId?: string }) {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const lessonPlan = await this.prisma.$transaction(async (tx) => {
          await this.enableRlsBypass(tx);

          return tx.lessonPlan.findFirst({
            where: {
              id,
              tenantId: access.tenantId,
              deletedAt: null,
              ...(access.teacherId ? { teacherId: access.teacherId } : {}),
              ...(access.schoolId ? { teacher: { schoolId: access.schoolId } } : {}),
            },
            select: {
              id: true,
              grade: true,
              subject: true,
              topic: true,
              status: true,
              durationMinutes: true,
              competences: true,
              objectives: true,
              activities: true,
              resources: true,
              assessment: true,
              adaptations: true,
              generatedByAI: true,
              rating: true,
              createdAt: true,
              updatedAt: true,
            },
          });
        });

        if (!lessonPlan) {
          throw new NotFoundException("Lesson plan not found");
        }

        return { data: lessonPlan };
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        lastError = error;
        this.logger.warn({
          event: "lesson_plan_read_retry",
          id,
          attempt,
          error: error instanceof Error ? error.message : "unknown",
        });

        if (attempt < 3) {
          await this.delay(attempt * 500);
        }
      }
    }

    throw new InternalServerErrorException({
      code: "LESSON_PLAN_READ_FAILED",
      message: "No se pudo abrir la planificacion generada",
      detail: lastError instanceof Error ? lastError.message : "Error desconocido",
    });
  }

  async saveFeedback(
    id: string,
    feedback: LessonPlanFeedbackDto,
    access: { tenantId: string; teacherId?: string; schoolId?: string },
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);

      const lessonPlan = await tx.lessonPlan.findFirst({
        where: {
          id,
          tenantId: access.tenantId,
          ...(access.teacherId ? { teacherId: access.teacherId } : {}),
          ...(access.schoolId ? { teacher: { schoolId: access.schoolId } } : {}),
        },
      });

      if (!lessonPlan) {
        throw new NotFoundException("Lesson plan not found");
      }

      const adaptations = this.asJsonObject(lessonPlan.adaptations);
      return tx.lessonPlan.update({
        where: { id: lessonPlan.id },
        data: {
          rating: feedback.rating,
          adaptations: {
            ...adaptations,
            feedback: {
              rating: feedback.rating,
              comment: feedback.comment?.trim() || null,
              submittedAt: new Date().toISOString(),
            },
          },
        },
      });
    });

    return { data: { id: updated.id, rating: updated.rating } };
  }

  private asJsonObject(value: Prisma.JsonValue | null): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
