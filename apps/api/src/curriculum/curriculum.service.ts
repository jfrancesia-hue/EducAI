import { Injectable, NotFoundException } from "@nestjs/common";
import { CurriculumAnalyzerAgent } from "@educai/ai";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CurriculumService {
  private readonly analyzer = new CurriculumAnalyzerAgent();

  constructor(private readonly prisma: PrismaService) {}

  async create(input: { tenantId: string; schoolId: string; name: string; grade: number; subject: string; content: unknown }) {
    const curriculum = await this.prisma.curriculum.create({
      data: {
        tenantId: input.tenantId,
        schoolId: input.schoolId,
        name: input.name,
        grade: input.grade,
        subject: input.subject,
        content: input.content ?? {},
        source: "manual",
      },
    });

    return { data: curriculum };
  }

  async analyze(id: string) {
    const curriculum = await this.prisma.curriculum.findUnique({ where: { id } });

    if (!curriculum) {
      throw new NotFoundException("Curriculum not found");
    }

    const gaps = await this.analyzer.analyze({
      country: "AR",
      schoolType: "school",
      subject: curriculum.subject,
      grade: curriculum.grade,
      content: JSON.stringify(curriculum.content),
    });

    await this.prisma.curriculumGap.deleteMany({ where: { curriculumId: id } });
    await this.prisma.curriculumGap.createMany({
      data: gaps.map((gap) => ({ ...gap, tenantId: curriculum.tenantId, curriculumId: id })),
    });

    return { data: { created: gaps.length, gaps } };
  }

  async gaps(id: string) {
    return { data: await this.prisma.curriculumGap.findMany({ where: { curriculumId: id } }) };
  }
}

