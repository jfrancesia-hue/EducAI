import { ForbiddenException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { Prisma } from "@educai/database";
import type { Logger } from "pino";

import { AppLogger } from "../common/logger/app-logger.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import type { CreateTeacherCourseDto } from "./dto/create-teacher-course.dto.js";
import type { UpdateTeacherCourseDto } from "./dto/update-teacher-course.dto.js";
import {
  TeacherCourseAccessDeniedError,
  TeacherCourseNotFoundError,
} from "./errors/teacher-course.errors.js";

/**
 * Estructura de `Classroom.metadata` (JSON libre). Todos los campos son
 * opcionales: el docente decide qué cargar.
 */
type ClassroomMetadata = {
  studentCount?: number;
  groupProfile?: string;
  priorKnowledge?: string;
  availableResources?: string;
  inclusionNotes?: string;
  institutionName?: string;
};

/**
 * Estructura legacy: antes de la migración `20260528200000_classroom_subject_and_metadata`
 * serializábamos `{subject, shift, studentCount}` como JSON dentro de
 * `Classroom.shift` con prefijo `json:`. La migración SQL backfilea los
 * registros existentes a los campos nativos, pero leemos ambos layouts por
 * una release como red de seguridad por si quedó algún Classroom sin migrar.
 */
type LegacyShiftPayload = {
  subject?: string;
  shift?: string;
  studentCount?: number;
};

const LEGACY_SHIFT_PREFIX = "json:";

export type TeacherCourseSummary = {
  id: string;
  name: string;
  grade: number;
  subject: string;
  shift: string | null;
  studentCount: number | null;
  groupProfile: string | null;
  priorKnowledge: string | null;
  availableResources: string | null;
  inclusionNotes: string | null;
  institutionName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TeacherCourseDetail = TeacherCourseSummary & {
  teacherId: string;
  schoolId: string;
};

export type TeacherCourseContextForLlm = {
  id: string;
  name: string;
  grade: number;
  subject: string;
  shift: string | null;
  studentCount: number | null;
  groupProfile: string | null;
  priorKnowledge: string | null;
  availableResources: string | null;
  inclusionNotes: string | null;
  institutionName: string | null;
};

type ClassroomRow = {
  id: string;
  name: string;
  grade: number;
  subject: string | null;
  shift: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class TeacherCourseService {
  private readonly log: Logger;

  constructor(
    private readonly prisma: PrismaService,
    logger: AppLogger,
  ) {
    this.log = logger.child({ component: "TeacherCourseService" });
  }

  async list(context: { tenantId: string; teacherId: string }): Promise<{
    data: TeacherCourseSummary[];
  }> {
    const rows = await this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);
      return tx.classroom.findMany({
        where: {
          tenantId: context.tenantId,
          teacherId: context.teacherId,
          deletedAt: null,
        },
        orderBy: [{ grade: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          grade: true,
          subject: true,
          shift: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return {
      data: rows.map((row) => this.toSummary(row)),
    };
  }

  async findOne(
    id: string,
    context: { tenantId: string; teacherId: string },
  ): Promise<{ data: TeacherCourseDetail }> {
    const row = await this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);
      return tx.classroom.findFirst({
        where: { id, tenantId: context.tenantId, deletedAt: null },
        select: {
          id: true,
          name: true,
          grade: true,
          subject: true,
          shift: true,
          metadata: true,
          teacherId: true,
          schoolId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    if (!row) {
      throw new TeacherCourseNotFoundError(id);
    }

    if (row.teacherId !== context.teacherId) {
      throw new TeacherCourseAccessDeniedError(id, context.teacherId);
    }

    const summary = this.toSummary({
      id: row.id,
      name: row.name,
      grade: row.grade,
      subject: row.subject,
      shift: row.shift,
      metadata: row.metadata,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });

    return {
      data: {
        ...summary,
        // El check de igualdad de arriba ya garantiza row.teacherId === context.teacherId.
        teacherId: context.teacherId,
        schoolId: row.schoolId,
      },
    };
  }

  async create(
    dto: CreateTeacherCourseDto,
    context: { tenantId: string; teacherId: string; schoolId: string },
  ): Promise<{ data: TeacherCourseSummary }> {
    const metadata = this.buildMetadataPatch({}, dto);
    const created = await this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);
      return tx.classroom.create({
        data: {
          tenantId: context.tenantId,
          teacherId: context.teacherId,
          schoolId: context.schoolId,
          name: dto.name.trim(),
          grade: dto.grade,
          subject: dto.subject.trim(),
          shift: this.normalizeShift(dto.shift),
          metadata:
            Object.keys(metadata).length > 0
              ? (metadata as Prisma.InputJsonValue)
              : Prisma.JsonNull,
        },
        select: {
          id: true,
          name: true,
          grade: true,
          subject: true,
          shift: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    this.log.info(
      {
        teacherCourseId: created.id,
        teacherId: context.teacherId,
        tenantId: context.tenantId,
        grade: dto.grade,
        subject: dto.subject,
      },
      "teacher_course.created",
    );

    return { data: this.toSummary(created) };
  }

  async update(
    id: string,
    dto: UpdateTeacherCourseDto,
    context: { tenantId: string; teacherId: string },
  ): Promise<{ data: TeacherCourseSummary }> {
    const existing = await this.findOne(id, context);
    const existingMetadata: ClassroomMetadata = {
      studentCount: existing.data.studentCount ?? undefined,
      groupProfile: existing.data.groupProfile ?? undefined,
      priorKnowledge: existing.data.priorKnowledge ?? undefined,
      availableResources: existing.data.availableResources ?? undefined,
      inclusionNotes: existing.data.inclusionNotes ?? undefined,
      institutionName: existing.data.institutionName ?? undefined,
    };

    const nextMetadata = this.buildMetadataPatch(existingMetadata, dto);
    const updated = await this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);
      return tx.classroom.update({
        where: { id },
        data: {
          name: dto.name !== undefined ? dto.name.trim() : undefined,
          grade: dto.grade !== undefined ? dto.grade : undefined,
          subject: dto.subject !== undefined ? dto.subject.trim() : undefined,
          shift: dto.shift !== undefined ? this.normalizeShift(dto.shift) : undefined,
          metadata:
            Object.keys(nextMetadata).length > 0
              ? (nextMetadata as Prisma.InputJsonValue)
              : Prisma.JsonNull,
        },
        select: {
          id: true,
          name: true,
          grade: true,
          subject: true,
          shift: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    this.log.info(
      {
        teacherCourseId: id,
        teacherId: context.teacherId,
      },
      "teacher_course.updated",
    );

    return { data: this.toSummary(updated) };
  }

  async remove(
    id: string,
    context: { tenantId: string; teacherId: string },
  ): Promise<{ data: { id: string; deletedAt: Date } }> {
    await this.findOne(id, context);

    const deletedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);
      await tx.classroom.update({
        where: { id },
        data: { deletedAt },
      });
    });

    this.log.info({ teacherCourseId: id, teacherId: context.teacherId }, "teacher_course.deleted");

    return { data: { id, deletedAt } };
  }

  /**
   * Resuelve el `teacherId` aplicable para el usuario autenticado.
   */
  async resolveTeacherContext(user: AuthenticatedUser): Promise<{
    tenantId: string;
    teacherId: string;
    schoolId: string;
  }> {
    if (!user.tenantId) {
      throw new ForbiddenException({
        code: "TENANTID_CONTEXT_MISSING",
        message: "Falta el claim tenantId en la sesion autenticada",
      });
    }

    if (user.teacherId && user.schoolId) {
      return {
        tenantId: user.tenantId,
        teacherId: user.teacherId,
        schoolId: user.schoolId,
      };
    }

    if (user.role !== "SCHOOL_ADMIN") {
      throw new ForbiddenException({
        code: "TEACHERID_CONTEXT_MISSING",
        message: "Falta el claim teacherId en la sesion autenticada",
      });
    }

    if (!user.schoolId) {
      throw new ForbiddenException({
        code: "SCHOOLID_CONTEXT_MISSING",
        message: "Falta el claim schoolId en la sesion autenticada",
      });
    }

    try {
      const teacher = await this.prisma.$transaction(async (tx) => {
        await this.enableRlsBypass(tx);
        return tx.teacher.findFirst({
          where: {
            tenantId: user.tenantId,
            schoolId: user.schoolId,
            deletedAt: null,
          },
          orderBy: { createdAt: "asc" },
          select: { id: true, schoolId: true },
        });
      });

      if (!teacher) {
        throw new ForbiddenException({
          code: "TEACHER_PROFILE_MISSING",
          message: "La escuela no tiene un perfil docente disponible para administrar los cursos",
        });
      }

      return {
        tenantId: user.tenantId,
        teacherId: teacher.id,
        schoolId: teacher.schoolId,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException({
        code: "TEACHER_COURSE_PROFILE_FAILED",
        message: "No se pudo preparar el perfil docente para administrar los cursos",
        detail: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Devuelve el contexto del curso para inyectar en el prompt del generador.
   * Devuelve `null` si el curso no existe o no pertenece al docente.
   */
  async getContextForLlm(
    courseId: string,
    context: { tenantId: string; teacherId: string },
  ): Promise<TeacherCourseContextForLlm | null> {
    try {
      const { data } = await this.findOne(courseId, context);
      return {
        id: data.id,
        name: data.name,
        grade: data.grade,
        subject: data.subject,
        shift: data.shift,
        studentCount: data.studentCount,
        groupProfile: data.groupProfile,
        priorKnowledge: data.priorKnowledge,
        availableResources: data.availableResources,
        inclusionNotes: data.inclusionNotes,
        institutionName: data.institutionName,
      };
    } catch (error) {
      if (
        error instanceof TeacherCourseNotFoundError ||
        error instanceof TeacherCourseAccessDeniedError
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * El rol `educai_app` no es service_role ni setea `app.tenant_id`, así que las
   * policies RLS del schema `educai` rechazan sus escrituras y filtran sus lecturas.
   * Igual que el resto de los servicios (lesson-plans, onboarding, dashboard),
   * habilitamos el bypass transaccional: la aislación por tenant ya la garantiza
   * el middleware de Prisma + el `tenantId` explícito en cada query.
   */
  private async enableRlsBypass(tx: Prisma.TransactionClient): Promise<void> {
    await tx.$executeRawUnsafe("SELECT set_config('app.bypass_rls', 'true', true)");
  }

  private toSummary(row: ClassroomRow): TeacherCourseSummary {
    const legacy = this.decodeLegacyShift(row.shift);
    const metadata = this.parseMetadata(row.metadata);

    return {
      id: row.id,
      name: row.name,
      grade: row.grade,
      // Preferir nativo; fallback a legacy si quedó algún Classroom sin migrar.
      subject: row.subject ?? legacy.subject ?? "",
      shift: row.subject ? row.shift : (legacy.shift ?? row.shift),
      studentCount: metadata.studentCount ?? legacy.studentCount ?? null,
      groupProfile: metadata.groupProfile ?? null,
      priorKnowledge: metadata.priorKnowledge ?? null,
      availableResources: metadata.availableResources ?? null,
      inclusionNotes: metadata.inclusionNotes ?? null,
      institutionName: metadata.institutionName ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private buildMetadataPatch(
    current: ClassroomMetadata,
    dto: Partial<{
      studentCount?: number;
      groupProfile?: string;
      priorKnowledge?: string;
      availableResources?: string;
      inclusionNotes?: string;
      institutionName?: string;
    }>,
  ): ClassroomMetadata {
    const next: ClassroomMetadata = { ...current };

    const writeString = (
      key:
        | "groupProfile"
        | "priorKnowledge"
        | "availableResources"
        | "inclusionNotes"
        | "institutionName",
    ) => {
      const incoming = dto[key];
      if (incoming === undefined) return;
      const trimmed = incoming.trim();
      if (trimmed) {
        next[key] = trimmed;
      } else {
        delete next[key];
      }
    };

    writeString("groupProfile");
    writeString("priorKnowledge");
    writeString("availableResources");
    writeString("inclusionNotes");
    writeString("institutionName");

    if (dto.studentCount !== undefined) {
      if (Number.isFinite(dto.studentCount)) {
        next.studentCount = dto.studentCount;
      } else {
        delete next.studentCount;
      }
    }

    return next;
  }

  private normalizeShift(shift: string | undefined): string | null | undefined {
    if (shift === undefined) return undefined;
    const trimmed = shift.trim();
    return trimmed || null;
  }

  private parseMetadata(raw: Prisma.JsonValue | null): ClassroomMetadata {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const candidate = raw as Record<string, unknown>;
    return {
      studentCount:
        typeof candidate.studentCount === "number" && Number.isFinite(candidate.studentCount)
          ? candidate.studentCount
          : undefined,
      groupProfile: typeof candidate.groupProfile === "string" ? candidate.groupProfile : undefined,
      priorKnowledge:
        typeof candidate.priorKnowledge === "string" ? candidate.priorKnowledge : undefined,
      availableResources:
        typeof candidate.availableResources === "string" ? candidate.availableResources : undefined,
      inclusionNotes:
        typeof candidate.inclusionNotes === "string" ? candidate.inclusionNotes : undefined,
      institutionName:
        typeof candidate.institutionName === "string" ? candidate.institutionName : undefined,
    };
  }

  /**
   * Decodifica el formato legacy de `Classroom.shift` (JSON con prefijo `json:`).
   * Sólo se usa como red de seguridad por si la migración no aplicó a algún registro.
   */
  private decodeLegacyShift(raw: string | null): LegacyShiftPayload {
    if (!raw || !raw.startsWith(LEGACY_SHIFT_PREFIX)) return {};
    try {
      const parsed = JSON.parse(raw.slice(LEGACY_SHIFT_PREFIX.length)) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      const candidate = parsed as Record<string, unknown>;
      return {
        subject: typeof candidate.subject === "string" ? candidate.subject : undefined,
        shift: typeof candidate.shift === "string" ? candidate.shift : undefined,
        studentCount:
          typeof candidate.studentCount === "number" && Number.isFinite(candidate.studentCount)
            ? candidate.studentCount
            : undefined,
      };
    } catch {
      return {};
    }
  }
}
