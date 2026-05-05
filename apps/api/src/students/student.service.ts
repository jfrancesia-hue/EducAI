import { Injectable } from "@nestjs/common";
import { DiagnosticService } from "@educai/ai";
import { AppLogger } from "../common/logger/app-logger.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { Logger } from "pino";
import type { DiagnosticAnswerDto } from "./dto/diagnostic-answer.dto.js";
import type { CreateStudentDto } from "./dto/create-student.dto.js";
import type { UpdateStudentDto } from "./dto/update-student.dto.js";
import { StudentNotFoundError, StudentProfileNotFoundError } from "./errors/student.errors.js";

@Injectable()
export class StudentService {
  private readonly diagnostic = new DiagnosticService();
  private readonly log: Logger;

  constructor(
    private readonly prisma: PrismaService,
    logger: AppLogger,
  ) {
    this.log = logger.child({ component: "StudentService" });
  }

  async create(dto: CreateStudentDto) {
    const student = await this.prisma.student.create({
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
    });

    this.log.info(
      { studentId: student.id, familyId: dto.familyId, grade: dto.grade },
      "student.created",
    );

    return { data: student };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: { profile: true, family: true, school: true },
    });

    if (!student) {
      throw new StudentNotFoundError(id);
    }

    return { data: student };
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.ensureExists(id);

    const profileTouched =
      dto.grade !== undefined || dto.curriculum !== undefined || dto.whatsappPhone !== undefined;

    const student = await this.prisma.student.update({
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

    this.log.info({ studentId: id, profileTouched }, "student.updated");

    return { data: student };
  }

  async startDiagnostic(id: string) {
    const student = await this.ensureExists(id);
    const profile = await this.ensureProfile(student.id);
    const state = this.diagnostic.start(profile.id);
    const question = this.diagnostic.nextQuestion(state, student.grade);

    this.log.info(
      { studentId: id, studentProfileId: profile.id, grade: student.grade },
      "diagnostic.started",
    );

    return { data: { state, question } };
  }

  async answerDiagnostic(id: string, dto: DiagnosticAnswerDto) {
    const student = await this.ensureExists(id);
    const profile = await this.ensureProfile(student.id);

    const state = this.diagnostic.registerAnswer(this.diagnostic.start(profile.id), dto);
    const summary = this.diagnostic.summarize(state);

    await this.prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        diagnosticCompleted: state.completed,
        diagnosticScore: summary,
      },
    });

    this.log.info(
      {
        studentId: id,
        studentProfileId: profile.id,
        questionId: dto.questionId,
        correct: dto.correct,
        completed: state.completed,
      },
      "diagnostic.answer_registered",
    );

    return {
      data: {
        state,
        summary,
        nextQuestion: this.diagnostic.nextQuestion(state, student.grade),
      },
    };
  }

  async progress(id: string) {
    const student = await this.ensureExists(id);
    const profile = await this.ensureProfile(student.id);

    const [completedSessions, achievements, minutesAggregation] = await Promise.all([
      this.prisma.learningSession.count({
        where: { studentProfileId: profile.id, completed: true },
      }),
      this.prisma.achievement.findMany({
        where: { studentProfileId: profile.id },
        orderBy: { earnedAt: "desc" },
        take: 5,
      }),
      this.prisma.learningSession.aggregate({
        where: {
          studentProfileId: profile.id,
          createdAt: { gte: this.startOfWeek() },
        },
        _sum: { durationMinutes: true },
      }),
    ]);

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

  private async ensureExists(id: string) {
    const student = await this.prisma.student.findFirst({ where: { id, deletedAt: null } });

    if (!student) {
      throw new StudentNotFoundError(id);
    }

    return student;
  }

  private async ensureProfile(studentId: string) {
    const profile = await this.prisma.studentProfile.findUnique({ where: { studentId } });

    if (!profile) {
      throw new StudentProfileNotFoundError(studentId);
    }

    return profile;
  }
}
