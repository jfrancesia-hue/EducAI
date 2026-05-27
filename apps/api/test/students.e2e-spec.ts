import { ValidationPipe } from "@nestjs/common";
import type { ExecutionContext, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";

import type { AuthenticatedRequest, AuthenticatedUser } from "../src/auth/authenticated-user.js";
import { SupabaseAuthGuard } from "../src/auth/supabase-auth.guard.js";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

const prismaMock = {
  $connect: vi.fn().mockResolvedValue(undefined),
  $disconnect: vi.fn().mockResolvedValue(undefined),
  $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
  $transaction: vi.fn(),
  student: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  studentProfile: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  curriculum: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
  curriculumGap: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  teacher: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  lessonPlan: {
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
  contactLead: {
    create: vi.fn(),
  },
  learningSession: {
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({ _sum: { durationMinutes: 0 } }),
  },
  achievement: {
    findMany: vi.fn().mockResolvedValue([]),
  },
};

prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock));

const authFixtures: Record<string, AuthenticatedUser> = {
  "token:family-1": {
    id: "usr_parent_1",
    email: "familia1@educai.local",
    role: "PARENT",
    familyId: "fam_1",
    tenantId: "tnt_1",
  },
  "token:family-missing-tenant": {
    id: "usr_parent_2",
    email: "familia2@educai.local",
    role: "PARENT",
    familyId: "fam_1",
  },
  "token:family-missing-family": {
    id: "usr_parent_3",
    email: "familia3@educai.local",
    role: "PARENT",
    tenantId: "tnt_1",
  },
  "token:family-intruder": {
    id: "usr_intruder",
    email: "intrusa@educai.local",
    role: "PARENT",
    familyId: "fam_intruder",
    tenantId: "tnt_1",
  },
  "token:tenant-intruder": {
    id: "usr_tenant_intruder",
    email: "tenant@educai.local",
    role: "PARENT",
    familyId: "fam_1",
    tenantId: "tnt_intruder",
  },
  "token:school-1": {
    id: "usr_school_1",
    email: "escuela1@educai.local",
    role: "SCHOOL_ADMIN",
    tenantId: "tnt_school_1",
    schoolId: "sch_1",
    plan: "docente-pro",
  },
  "token:school-missing-school": {
    id: "usr_school_missing",
    email: "escuela-missing@educai.local",
    role: "SCHOOL_ADMIN",
    tenantId: "tnt_school_1",
  },
  "token:school-intruder": {
    id: "usr_school_intruder",
    email: "escuela-intrusa@educai.local",
    role: "SCHOOL_ADMIN",
    tenantId: "tnt_school_1",
    schoolId: "sch_intruder",
    plan: "docente-pro",
  },
  "token:teacher-1": {
    id: "usr_teacher_1",
    email: "docente1@educai.local",
    role: "TEACHER",
    tenantId: "tnt_school_1",
    teacherId: "tea_1",
    plan: "free",
  },
  "token:teacher-pro": {
    id: "usr_teacher_pro",
    email: "docente-pro@educai.local",
    role: "TEACHER",
    tenantId: "tnt_school_1",
    teacherId: "tea_pro",
    plan: "docente-pro",
  },
  "token:teacher-free-exhausted": {
    id: "usr_teacher_free_exhausted",
    email: "docente-free-exhausted@educai.local",
    role: "TEACHER",
    tenantId: "tnt_school_1",
    teacherId: "tea_free_exhausted",
    plan: "free",
  },
  "token:teacher-missing-teacher": {
    id: "usr_teacher_missing",
    email: "docente-missing@educai.local",
    role: "TEACHER",
    tenantId: "tnt_school_1",
  },
  "token:teacher-intruder": {
    id: "usr_teacher_intruder",
    email: "docente-intruso@educai.local",
    role: "TEACHER",
    tenantId: "tnt_school_1",
    teacherId: "tea_intruder",
    plan: "free",
  },
};

const supabaseAuthGuardMock = {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const raw = request.headers.authorization;
    const header = Array.isArray(raw) ? raw[0] : raw;

    if (!header || !header.startsWith("Bearer ")) {
      return false;
    }

    const token = header.slice("Bearer ".length);
    const user = authFixtures[token];

    if (!user) {
      return false;
    }

    request.user = user;
    return true;
  },
};

describe("Students API (e2e)", () => {
  let app: INestApplication;
  let originalAnthropicApiKey: string | undefined;
  let originalOpenAiApiKey: string | undefined;

  beforeAll(async () => {
    originalAnthropicApiKey = process.env.ANTHROPIC_API_KEY;
    originalOpenAiApiKey = process.env.OPENAI_API_KEY;
    process.env.ANTHROPIC_API_KEY = "";
    process.env.OPENAI_API_KEY = "test-openai-api-key";

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideGuard(SupabaseAuthGuard)
      .useValue(supabaseAuthGuardMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    if (originalAnthropicApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalAnthropicApiKey;
    }
    if (originalOpenAiApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAiApiKey;
    }
  });

  it("POST /students rechaza body invalido (sin tenant context, grade fuera de rango)", async () => {
    const response = await request(app.getHttpServer())
      .post("/students")
      .set("Authorization", "Bearer token:family-1")
      .send({ firstName: "X", lastName: "Y", grade: 99 });

    expect(response.status).toBe(400);
  });

  it("POST /public-intake/contact-leads acepta payload valido y persiste lead", async () => {
    prismaMock.contactLead.create.mockResolvedValueOnce({
      id: "lead_1",
      email: "codex@example.com",
      product: "educai",
      plan: "demo",
      status: "open",
    });

    const response = await request(app.getHttpServer()).post("/public-intake/contact-leads").send({
      name: "Codex Test",
      email: "codex@example.com",
      institution: "QA School",
      quantity: 12,
      product: "educai",
      plan: "demo",
      message: "hola",
    });

    expect(response.status).toBe(201);
    expect(prismaMock.contactLead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Codex Test",
          email: "codex@example.com",
          institution: "QA School",
          quantity: 12,
          product: "educai",
          plan: "demo",
          message: "hola",
        }),
      }),
    );
    expect(response.body).toEqual({
      data: {
        id: "lead_1",
        status: "open",
      },
    });
  });

  it("POST /public-intake/contact-leads rechaza campos no esperados", async () => {
    const response = await request(app.getHttpServer()).post("/public-intake/contact-leads").send({
      name: "Codex Test",
      email: "codex@example.com",
      unexpected: "field",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("property unexpected should not exist");
  });

  it("POST /public-intake/contact-leads propaga errores de persistencia", async () => {
    prismaMock.contactLead.create.mockRejectedValueOnce(new Error("db unavailable"));

    const response = await request(app.getHttpServer()).post("/public-intake/contact-leads").send({
      name: "Codex Test",
      email: "codex@example.com",
    });

    expect(response.status).toBe(500);
  });

  it("POST /students crea estudiante con body valido", async () => {
    prismaMock.student.create.mockResolvedValueOnce({
      id: "stu_new",
      familyId: "fam_1",
      profile: { id: "prof_new" },
    });

    const response = await request(app.getHttpServer())
      .post("/students")
      .set("Authorization", "Bearer token:family-1")
      .send({
        firstName: "Mateo",
        lastName: "Demo",
        grade: 6,
      });

    expect(prismaMock.student.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: "tnt_1",
          familyId: "fam_1",
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe("stu_new");
  });

  it("POST /students sin tenantId en claims devuelve 403", async () => {
    const response = await request(app.getHttpServer())
      .post("/students")
      .set("Authorization", "Bearer token:family-missing-tenant")
      .send({
        firstName: "Mateo",
        lastName: "Demo",
        grade: 6,
      });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("TENANT_CONTEXT_MISSING");
  });

  it("GET /students/:id sin familyId en claims devuelve 403", async () => {
    const response = await request(app.getHttpServer())
      .get("/students/stu_1")
      .set("Authorization", "Bearer token:family-missing-family");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("FAMILY_CONTEXT_MISSING");
  });

  it("GET /students/:id sin tenantId en claims devuelve 403", async () => {
    const response = await request(app.getHttpServer())
      .get("/students/stu_1")
      .set("Authorization", "Bearer token:family-missing-tenant");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("TENANT_CONTEXT_MISSING");
  });

  it("GET /students/:id con familia distinta devuelve 403", async () => {
    prismaMock.student.findFirst.mockResolvedValueOnce({
      id: "stu_1",
      familyId: "fam_owner",
      tenantId: "tnt_1",
    });

    const response = await request(app.getHttpServer())
      .get("/students/stu_1")
      .set("Authorization", "Bearer token:family-intruder");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("FAMILY_ACCESS_DENIED");
  });

  it("GET /students/:id con tenant distinto devuelve 403", async () => {
    prismaMock.student.findFirst.mockResolvedValueOnce({
      id: "stu_1",
      familyId: "fam_1",
      tenantId: "tnt_owner",
    });

    const response = await request(app.getHttpServer())
      .get("/students/stu_1")
      .set("Authorization", "Bearer token:tenant-intruder");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("TENANT_ACCESS_DENIED");
  });

  it("GET /students/:id devuelve 404 cuando no existe", async () => {
    prismaMock.student.findFirst.mockResolvedValueOnce(null);

    const response = await request(app.getHttpServer())
      .get("/students/stu_404")
      .set("Authorization", "Bearer token:family-1");

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("STUDENT_NOT_FOUND");
  });

  it("GET /students/:id/progress devuelve agregados", async () => {
    prismaMock.student.findFirst.mockResolvedValue({
      id: "stu_1",
      familyId: "fam_1",
      tenantId: "tnt_1",
      grade: 6,
    });
    prismaMock.studentProfile.findUnique.mockResolvedValue({
      id: "prof_1",
      strongSubjects: ["ciencias"],
      weakSubjects: ["matematica"],
      diagnosticCompleted: true,
    });

    const response = await request(app.getHttpServer())
      .get("/students/stu_1/progress")
      .set("Authorization", "Bearer token:family-1");

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      studentId: "stu_1",
      strengths: ["ciencias"],
      opportunities: ["matematica"],
      diagnosticCompleted: true,
    });
  });

  it("POST /curricula sin schoolId en claims devuelve 403", async () => {
    const response = await request(app.getHttpServer())
      .post("/curricula")
      .set("Authorization", "Bearer token:school-missing-school")
      .send({
        name: "Matematica 7A",
        grade: 7,
        subject: "matematica",
        content: { unit: "proporcionalidad" },
      });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("SCHOOLID_CONTEXT_MISSING");
  });

  it("POST /curricula crea curriculo con contexto institucional por claims", async () => {
    prismaMock.curriculum.create.mockResolvedValueOnce({
      id: "cur_1",
      tenantId: "tnt_school_1",
      schoolId: "sch_1",
    });

    const response = await request(app.getHttpServer())
      .post("/curricula")
      .set("Authorization", "Bearer token:school-1")
      .send({
        name: "Matematica 7A",
        grade: 7,
        subject: "matematica",
        content: { unit: "proporcionalidad" },
      });

    expect(response.status).toBe(201);
    expect(prismaMock.curriculum.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: "tnt_school_1",
          schoolId: "sch_1",
        }),
      }),
    );
  });

  it("POST /curricula/:id/analyze con tenant o school incorrectos devuelve 404", async () => {
    prismaMock.curriculum.findFirst.mockResolvedValueOnce(null);

    const response = await request(app.getHttpServer())
      .post("/curricula/cur_404/analyze")
      .set("Authorization", "Bearer token:school-intruder");

    expect(response.status).toBe(404);
  });

  it("POST /lesson-plans/generate sin teacherId en claims devuelve 403", async () => {
    const response = await request(app.getHttpServer())
      .post("/lesson-plans/generate")
      .set("Authorization", "Bearer token:teacher-missing-teacher")
      .send({
        educationLevel: "secundaria",
        grade: 7,
        subject: "matematica",
        topic: "proporcionalidad",
        sessionCount: 2,
        totalDurationMinutes: 80,
      });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("TEACHERID_CONTEXT_MISSING");
  });

  it("POST /lesson-plans/generate crea plan con contexto docente por claims", async () => {
    prismaMock.lessonPlan.count.mockResolvedValueOnce(0);
    prismaMock.lessonPlan.create.mockResolvedValueOnce({
      id: "plan_1",
      tenantId: "tnt_school_1",
      teacherId: "tea_1",
    });

    const response = await request(app.getHttpServer())
      .post("/lesson-plans/generate")
      .set("Authorization", "Bearer token:teacher-1")
      .send({
        educationLevel: "secundaria",
        grade: 7,
        subject: "matematica",
        topic: "proporcionalidad",
        sessionCount: 2,
        totalDurationMinutes: 80,
      });

    expect(response.status).toBe(201);
    expect(prismaMock.lessonPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: "tnt_school_1",
          teacherId: "tea_1",
        }),
      }),
    );
    expect(response.body.data.id).toBe("plan_1");
  });

  it("POST /lesson-plans/generate bloquea Free al agotar sus 2 planificaciones", async () => {
    prismaMock.lessonPlan.count.mockResolvedValueOnce(2);
    prismaMock.lessonPlan.create.mockClear();

    const response = await request(app.getHttpServer())
      .post("/lesson-plans/generate")
      .set("Authorization", "Bearer token:teacher-free-exhausted")
      .send({
        educationLevel: "secundaria",
        grade: 7,
        subject: "matematica",
        topic: "proporcionalidad",
        sessionCount: 2,
        totalDurationMinutes: 80,
      });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("LESSON_PLAN_QUOTA_EXCEEDED");
    expect(response.body.plan).toBe("free");
    expect(response.body.limit).toBe(2);
    expect(response.body.used).toBe(2);
    expect(prismaMock.lessonPlan.create).not.toHaveBeenCalled();
  });

  it("POST /lesson-plans/generate permite plan pago por debajo del limite mensual", async () => {
    prismaMock.lessonPlan.count.mockResolvedValueOnce(12);
    prismaMock.lessonPlan.create.mockResolvedValueOnce({
      id: "plan_pro_1",
      tenantId: "tnt_school_1",
      teacherId: "tea_pro",
    });

    const response = await request(app.getHttpServer())
      .post("/lesson-plans/generate")
      .set("Authorization", "Bearer token:teacher-pro")
      .send({
        educationLevel: "secundaria",
        grade: 7,
        subject: "matematica",
        topic: "proporcionalidad",
        sessionCount: 2,
        totalDurationMinutes: 80,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe("plan_pro_1");
  });

  it("POST /lesson-plans/generate permite al admin escolar crear plan con perfil docente asociado", async () => {
    prismaMock.lessonPlan.count.mockResolvedValueOnce(0);
    prismaMock.teacher.findFirst.mockResolvedValueOnce({
      id: "tea_school_admin_1",
      tenantId: "tnt_school_1",
      schoolId: "sch_1",
    });
    prismaMock.lessonPlan.create.mockResolvedValueOnce({
      id: "plan_school_admin_1",
      tenantId: "tnt_school_1",
      teacherId: "tea_school_admin_1",
    });

    const response = await request(app.getHttpServer())
      .post("/lesson-plans/generate")
      .set("Authorization", "Bearer token:school-1")
      .send({
        educationLevel: "secundaria",
        grade: 7,
        subject: "matematica",
        topic: "proporcionalidad",
        sessionCount: 2,
        totalDurationMinutes: 80,
      });

    expect(response.status).toBe(201);
    expect(prismaMock.teacher.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: "tnt_school_1",
          schoolId: "sch_1",
        }),
      }),
    );
    expect(prismaMock.lessonPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: "tnt_school_1",
          teacherId: "tea_school_admin_1",
        }),
      }),
    );
    expect(response.body.data.id).toBe("plan_school_admin_1");
  });

  it("GET /lesson-plans/:id con tenant o teacher incorrectos devuelve 404", async () => {
    prismaMock.lessonPlan.findFirst.mockResolvedValueOnce(null);

    const response = await request(app.getHttpServer())
      .get("/lesson-plans/plan_404")
      .set("Authorization", "Bearer token:teacher-intruder");

    expect(response.status).toBe(404);
  });
});
