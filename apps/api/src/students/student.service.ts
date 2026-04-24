import { Injectable, NotFoundException } from "@nestjs/common";
import { DiagnosticService } from "@educai/ai";
import { PrismaService } from "../prisma/prisma.service";
import type { DiagnosticAnswerDto } from "./dto/diagnostic-answer.dto";
import type { CreateStudentDto } from "./dto/create-student.dto";
import type { UpdateStudentDto } from "./dto/update-student.dto";

@Injectable()
export class StudentService {
  private readonly diagnostic = new DiagnosticService();

  constructor(private readonly prisma: PrismaService) {}

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

    return { data: student };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: { profile: true, family: true, school: true },
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    return { data: student };
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.ensureExists(id);

    const student = await this.prisma.student.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        grade: dto.grade,
        profile: dto.grade || dto.curriculum || dto.whatsappPhone
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

    return { data: student };
  }

  async startDiagnostic(id: string) {
    const student = await this.ensureExists(id);
    const profile = await this.ensureProfile(student.id);
    const state = this.diagnostic.start(profile.id);
    const question = this.diagnostic.nextQuestion(state, student.grade);

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

    const [completedSessions, achievements] = await Promise.all([
      this.prisma.learningSession.count({ where: { studentProfileId: profile.id, completed: true } }),
      this.prisma.achievement.findMany({ where: { studentProfileId: profile.id }, take: 5 }),
    ]);

    return {
      data: {
        studentId: student.id,
        completedSessions,
        minutesThisWeek: 0,
        strengths: profile.strongSubjects,
        opportunities: profile.weakSubjects,
        achievements,
      },
    };
  }

  private async ensureExists(id: string) {
    const student = await this.prisma.student.findFirst({ where: { id, deletedAt: null } });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    return student;
  }

  private async ensureProfile(studentId: string) {
    const profile = await this.prisma.studentProfile.findUnique({ where: { studentId } });

    if (!profile) {
      throw new NotFoundException("Student profile not found");
    }

    return profile;
  }
}

