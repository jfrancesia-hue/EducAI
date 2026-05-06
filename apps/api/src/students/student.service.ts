import { Injectable } from "@nestjs/common";
import { DiagnosticService, type DiagnosticState } from "@educai/ai";
import { Prisma } from "@educai/database";
import type { AuthenticatedUser } from "../auth/types.js";
import { AppLogger } from "../common/logger/app-logger.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { Logger } from "pino";
import type { DiagnosticAnswerDto } from "./dto/diagnostic-answer.dto.js";
import type { CreateStudentDto } from "./dto/create-student.dto.js";
import type { UpdateStudentDto } from "./dto/update-student.dto.js";
import { StudentNotFoundError, StudentProfileNotFoundError } from "./errors/student.errors.js";

type RlsDb = Prisma.TransactionClient;

@Injectable()
export class StudentService {
  private readonly log: Logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly diagnostic: DiagnosticService,
    logger: AppLogger,
  ) {
    this.log = logger.child({ component: "StudentService" });
  }

  async create(dto: CreateStudentDto, user: AuthenticatedUser) {
    const student = await this.prisma.withUser(user, async (db) =>
      db.student.create({
        data: {
          tenantId: dto.tenantId,
          familyId: dto.familyId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          grade: dto.grade,
          profile: {
            create: {
              tenantId: dto.tenantId,
              grade: dto.grade,
              country: "AR",
              curriculum: dto.curriculum ?? "AR-NOA",
              strongSubjects: [],
              weakSubjects: [],
              whatsappPhone: dto.whatsappPhone,
            },
          },
        },
        include: { profile: true },
      }),
    );

    this.log.info(
      { studentId: student.id, familyId: dto.familyId, grade: dto.grade },
      "student.created",
    );

    return { data: student };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const student = await this.prisma.withUser(user, (db) =>
      db.student.findFirst({
        where: { id, deletedAt: null },
        include: { profile: true, family: true, school: true },
      }),
    );

    if (!student) {
      throw new StudentNotFoundError(id);
    }

    return { data: student };
  }

  async update(id: string, dto: UpdateStudentDto, user: AuthenticatedUser) {
    const profileTouched =
      dto.grade !== undefined || dto.curriculum !== undefined || dto.whatsappPhone !== undefined;

    const student = await this.prisma.withUser(user, async (db) => {
      await this.ensureExists(db, id);

      return db.student.update({
        where: { id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          grade: dto.grade,
          profile: profileTouched
            ? {
                update: {
                  grade: dto.grade,
                  curriculum: dto.curriculum,
                  whatsappPhone: dto.whatsappPhone,
                },
              }
            : undefined,
        },
        include: { profile: true },
      });
    });

    this.log.info({ studentId: id, profileTouched }, "student.updated");

    return { data: student };
  }

  /**
   * Inicia o retoma un diagnóstico. Si ya hay state in-progress en DB lo
   * retoma y devuelve la última pregunta sin respuesta. Si no, arranca uno nuevo.
   */
  async startDiagnostic(id: string, user: AuthenticatedUser) {
    const { student, profile } = await this.loadStudentAndProfile(id, user);

    const existing = this.readState(profile.diagnosticState);
    const state = existing ?? this.diagnostic.start(profile.id, student.grade);
    const isResume = existing != null;

    const question = await this.diagnostic.nextQuestion(state);
    await this.prisma.withUser(user, (db) => this.persistState(db, profile.id, state));

    this.log.info(
      {
        studentId: id,
        studentProfileId: profile.id,
        grade: student.grade,
        resumed: isResume,
        questionsAsked: state.questions.length,
      },
      "diagnostic.started",
    );

    return { data: { state, question, resumed: isResume } };
  }

  async answerDiagnostic(id: string, dto: DiagnosticAnswerDto, user: AuthenticatedUser) {
    const { student, profile } = await this.loadStudentAndProfile(id, user);

    const state = this.readState(profile.diagnosticState);
    if (!state) {
      throw new StudentProfileNotFoundError(student.id);
    }

    const updated = this.diagnostic.registerAnswer(state, dto.questionId, dto.answer);

    if (updated.completed) {
      const summary = await this.diagnostic.summarize(updated);
      await this.prisma.withUser(user, (db) =>
        db.studentProfile.update({
          where: { id: profile.id },
          data: {
            diagnosticCompleted: true,
            diagnosticScore: summary as unknown as Prisma.InputJsonValue,
            diagnosticState: Prisma.JsonNull,
          },
        }),
      );

      this.log.info(
        {
          studentId: id,
          studentProfileId: profile.id,
          score: summary.score,
          totalQuestions: summary.totalQuestions,
        },
        "diagnostic.completed",
      );

      return { data: { state: updated, summary, nextQuestion: null } };
    }

    const nextQuestion = await this.diagnostic.nextQuestion(updated);
    await this.prisma.withUser(user, (db) => this.persistState(db, profile.id, updated));

    this.log.info(
      {
        studentId: id,
        studentProfileId: profile.id,
        questionId: dto.questionId,
        questionsAnswered: updated.answers.length,
      },
      "diagnostic.answer_registered",
    );

    return { data: { state: updated, summary: null, nextQuestion } };
  }

  async progress(id: string, user: AuthenticatedUser) {
    const { student, profile, completedSessions, achievements, minutesAggregation } =
      await this.prisma.withUser(user, async (db) => {
        const student = await this.ensureExists(db, id);
        const profile = await this.ensureProfile(db, student.id);
        const [completedSessions, achievements, minutesAggregation] = await Promise.all([
          db.learningSession.count({
            where: { studentProfileId: profile.id, completed: true },
          }),
          db.achievement.findMany({
            where: { studentProfileId: profile.id },
            orderBy: { earnedAt: "desc" },
            take: 5,
          }),
          db.learningSession.aggregate({
            where: {
              studentProfileId: profile.id,
              createdAt: { gte: this.startOfWeek() },
            },
            _sum: { durationMinutes: true },
          }),
        ]);

        return { student, profile, completedSessions, achievements, minutesAggregation };
      });

    return {
      data: {
        studentId: student.id,
        completedSessions,
        minutesThisWeek: minutesAggregation._sum.durationMinutes ?? 0,
        strengths: profile.strongSubjects,
        opportunities: profile.weakSubjects,
        diagnosticCompleted: profile.diagnosticCompleted,
        achievements,
      },
    };
  }

  private startOfWeek(reference: Date = new Date()): Date {
    const date = new Date(reference);
    const day = date.getDay();
    const diff = (day + 6) % 7;
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private async loadStudentAndProfile(id: string, user: AuthenticatedUser) {
    return this.prisma.withUser(user, async (db) => {
      const student = await this.ensureExists(db, id);
      const profile = await this.ensureProfile(db, student.id);
      return { student, profile };
    });
  }

  private async ensureExists(db: RlsDb, id: string) {
    const student = await db.student.findFirst({ where: { id, deletedAt: null } });

    if (!student) {
      throw new StudentNotFoundError(id);
    }

    return student;
  }

  private async ensureProfile(db: RlsDb, studentId: string) {
    const profile = await db.studentProfile.findUnique({ where: { studentId } });

    if (!profile) {
      throw new StudentProfileNotFoundError(studentId);
    }

    return profile;
  }

  private readState(raw: unknown): DiagnosticState | null {
    if (!raw || typeof raw !== "object") {
      return null;
    }
    const state = raw as DiagnosticState;
    if (typeof state.studentProfileId !== "string" || !Array.isArray(state.questions)) {
      return null;
    }
    return state;
  }

  private async persistState(
    db: RlsDb,
    studentProfileId: string,
    state: DiagnosticState,
  ): Promise<void> {
    await db.studentProfile.update({
      where: { id: studentProfileId },
      data: {
        diagnosticState: state as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
