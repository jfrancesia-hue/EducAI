import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AnthropicLlmClient, CurriculumAnalyzerAgent } from "@educai/ai";
import { Prisma } from "@educai/database";
import { isElevatedRole, type AuthenticatedUser } from "../auth/types.js";
import { PrismaService } from "../prisma/prisma.service.js";

type RlsDb = Prisma.TransactionClient;

@Injectable()
export class CurriculumService {
  private readonly analyzer = new CurriculumAnalyzerAgent(
    process.env.ANTHROPIC_API_KEY
      ? new AnthropicLlmClient({
          defaultModel: "claude-3-5-sonnet-latest",
          defaultMaxTokens: 1400,
        })
      : undefined,
  );

  constructor(private readonly prisma: PrismaService) {}

  async create(
    input: {
      tenantId: string;
      schoolId: string;
      name: string;
      grade: number;
      subject: string;
      content: unknown;
    },
    user: AuthenticatedUser,
  ) {
    this.assertSchoolScope(input.schoolId, user);
    this.assertReasonableContentSize(input.content);

    const curriculum = await this.prisma.withUser(user, async (db) => {
      await this.ensureSchoolInTenant(db, input.schoolId, user.tenantId);

      return db.curriculum.create({
        data: {
          tenantId: user.tenantId,
          schoolId: input.schoolId,
          name: input.name,
          grade: input.grade,
          subject: input.subject,
          content: input.content ?? {},
          source: "manual",
        },
      });
    });

    return { data: curriculum };
  }

  async analyze(id: string, user: AuthenticatedUser) {
    const curriculum = await this.findScopedCurriculum(id, user);
    this.assertSchoolScope(curriculum.schoolId, user);

    const gaps = await this.analyzer.analyze({
      country: "AR",
      schoolType: "school",
      subject: curriculum.subject,
      grade: curriculum.grade,
      content: JSON.stringify(curriculum.content),
    });

    await this.prisma.withUser(user, async (db) => {
      await db.curriculumGap.deleteMany({
        where: { curriculumId: id, tenantId: user.tenantId },
      });
      await db.curriculumGap.createMany({
        data: gaps.map((gap) => ({ ...gap, tenantId: curriculum.tenantId, curriculumId: id })),
      });
    });

    return { data: { created: gaps.length, gaps } };
  }

  async gaps(id: string, user: AuthenticatedUser) {
    const curriculum = await this.findScopedCurriculum(id, user);
    this.assertSchoolScope(curriculum.schoolId, user);

    const gaps = await this.prisma.withUser(user, (db) =>
      db.curriculumGap.findMany({
        where: { curriculumId: id, tenantId: user.tenantId },
      }),
    );

    return {
      data: gaps,
    };
  }

  private assertSchoolScope(schoolId: string, user: AuthenticatedUser): void {
    if (!isElevatedRole(user) && user.schoolId !== schoolId) {
      throw new ForbiddenException({
        code: "SCHOOL_ACCESS_DENIED",
        message: `El usuario autenticado no tiene acceso al colegio ${schoolId}`,
        schoolId,
      });
    }
  }

  private async findScopedCurriculum(id: string, user: AuthenticatedUser) {
    const curriculum = await this.prisma.withUser(user, (db) =>
      db.curriculum.findFirst({
        where: { id, tenantId: user.tenantId },
      }),
    );

    if (!curriculum) {
      throw new NotFoundException("Curriculum not found");
    }

    return curriculum;
  }

  private async ensureSchoolInTenant(db: RlsDb, schoolId: string, tenantId: string): Promise<void> {
    const school = await db.school.findFirst({
      where: { id: schoolId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!school) {
      throw new NotFoundException("School not found");
    }
  }

  private assertReasonableContentSize(content: unknown): void {
    if (JSON.stringify(content).length > 250_000) {
      throw new BadRequestException({
        code: "CURRICULUM_CONTENT_TOO_LARGE",
        message: "El contenido curricular excede el tamano maximo permitido",
      });
    }
  }
}
