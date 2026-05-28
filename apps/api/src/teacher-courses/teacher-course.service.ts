import { ForbiddenException, Injectable, InternalServerErrorException } from "@nestjs/common";
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
 * Metadata serializada dentro de `Classroom.shift`.
 *
 * Limitación temporal: el schema actual de `Classroom` no tiene un JSON
 * libre ni campo `subject`. Para no bloquear el feature, serializamos los
 * datos pedagógicos básicos del curso en el campo `shift` (que originalmente
 * era el turno). Cuando se amplíe el schema con un `metadata Json?` y un
 * `subject String?` la migración hacia campos nativos es directa.
 */
type ClassroomShiftMetadata = {
  /** Materia principal (obligatoria para el curso). */
  subject?: string;
  /** Turno real (mañana, tarde, noche...). */
  shift?: string;
  /** Cantidad de alumnos declarados por el docente. */
  studentCount?: number;
};

const SHIFT_METADATA_PREFIX = "json:";

export type TeacherCourseSummary = {
  id: string;
  name: string;
  grade: number;
  subject: string;
  shift: string | null;
  studentCount: number | null;
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
    const rows = await this.prisma.classroom.findMany({
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
        shift: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      data: rows.map((row) => this.toSummary(row)),
    };
  }

  async findOne(
    id: string,
    context: { tenantId: string; teacherId: string },
  ): Promise<{ data: TeacherCourseDetail }> {
    const row = await this.prisma.classroom.findFirst({
      where: { id, tenantId: context.tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        grade: true,
        shift: true,
        teacherId: true,
        schoolId: true,
        createdAt: true,
        updatedAt: true,
      },
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
      shift: row.shift,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });

    return {
      data: {
        ...summary,
        teacherId: row.teacherId,
        schoolId: row.schoolId,
      },
    };
  }

  async create(
    dto: CreateTeacherCourseDto,
    context: { tenantId: string; teacherId: string; schoolId: string },
  ): Promise<{ data: TeacherCourseSummary }> {
    const created = await this.prisma.classroom.create({
      data: {
        tenantId: context.tenantId,
        teacherId: context.teacherId,
        schoolId: context.schoolId,
        name: dto.name.trim(),
        grade: dto.grade,
        shift: this.encodeShiftMetadata({
          subject: dto.subject.trim(),
          shift: dto.shift?.trim() || undefined,
          studentCount: dto.studentCount,
        }),
      },
      select: {
        id: true,
        name: true,
        grade: true,
        shift: true,
        createdAt: true,
        updatedAt: true,
      },
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
    const currentMetadata: ClassroomShiftMetadata = {
      subject: existing.data.subject,
      shift: existing.data.shift ?? undefined,
      studentCount: existing.data.studentCount ?? undefined,
    };

    const nextMetadata: ClassroomShiftMetadata = {
      subject: dto.subject !== undefined ? dto.subject.trim() : currentMetadata.subject,
      shift: dto.shift !== undefined ? dto.shift.trim() || undefined : currentMetadata.shift,
      studentCount:
        dto.studentCount !== undefined ? dto.studentCount : currentMetadata.studentCount,
    };

    const updated = await this.prisma.classroom.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        grade: dto.grade !== undefined ? dto.grade : undefined,
        shift: this.encodeShiftMetadata(nextMetadata),
      },
      select: {
        id: true,
        name: true,
        grade: true,
        shift: true,
        createdAt: true,
        updatedAt: true,
      },
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
    // Aseguramos pertenencia antes de tocar nada.
    await this.findOne(id, context);

    const deletedAt = new Date();
    await this.prisma.classroom.update({
      where: { id },
      data: { deletedAt },
    });

    this.log.info({ teacherCourseId: id, teacherId: context.teacherId }, "teacher_course.deleted");

    return { data: { id, deletedAt } };
  }

  /**
   * Resuelve el `teacherId` aplicable para el usuario autenticado.
   * Reutiliza la misma semántica que `LessonPlanService.resolveTeacherIdForPlanning`:
   * - Si el usuario tiene `teacherId`, lo usa.
   * - Si es `SCHOOL_ADMIN`, toma el primer docente disponible del colegio.
   * - En otro caso devuelve 403 con códigos estables para el frontend.
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
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          tenantId: user.tenantId,
          schoolId: user.schoolId,
          deletedAt: null,
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, schoolId: true },
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

  private toSummary(row: {
    id: string;
    name: string;
    grade: number;
    shift: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): TeacherCourseSummary {
    const metadata = this.decodeShiftMetadata(row.shift);
    return {
      id: row.id,
      name: row.name,
      grade: row.grade,
      subject: metadata.subject ?? "",
      shift: metadata.shift ?? null,
      studentCount: metadata.studentCount ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private encodeShiftMetadata(metadata: ClassroomShiftMetadata): string {
    const cleaned: ClassroomShiftMetadata = {};
    if (metadata.subject && metadata.subject.trim()) {
      cleaned.subject = metadata.subject.trim();
    }
    if (metadata.shift && metadata.shift.trim()) {
      cleaned.shift = metadata.shift.trim();
    }
    if (typeof metadata.studentCount === "number" && Number.isFinite(metadata.studentCount)) {
      cleaned.studentCount = metadata.studentCount;
    }
    return `${SHIFT_METADATA_PREFIX}${JSON.stringify(cleaned)}`;
  }

  private decodeShiftMetadata(raw: string | null): ClassroomShiftMetadata {
    if (!raw) {
      return {};
    }
    if (!raw.startsWith(SHIFT_METADATA_PREFIX)) {
      // Compatibilidad hacia atrás: cursos viejos donde `shift` era turno crudo.
      return { shift: raw };
    }
    try {
      const parsed = JSON.parse(raw.slice(SHIFT_METADATA_PREFIX.length)) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
      }
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
