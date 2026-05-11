import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Test } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

const prismaMock = {
  $connect: vi.fn().mockResolvedValue(undefined),
  $disconnect: vi.fn().mockResolvedValue(undefined),
  student: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  studentProfile: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  learningSession: {
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({ _sum: { durationMinutes: 0 } }),
  },
  achievement: {
    findMany: vi.fn().mockResolvedValue([]),
  },
};

describe("Students API (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("POST /students rechaza body invalido (sin tenant context, grade fuera de rango)", async () => {
    const response = await request(app.getHttpServer())
      .post("/students")
      .set("x-family-id", "fam_1")
      .set("x-tenant-id", "tnt_1")
      .send({ firstName: "X", lastName: "Y", grade: 99 });

    expect(response.status).toBe(400);
  });

  it("POST /students crea estudiante con body valido", async () => {
    prismaMock.student.create.mockResolvedValueOnce({
      id: "stu_new",
      familyId: "fam_1",
      profile: { id: "prof_new" },
    });

    const response = await request(app.getHttpServer())
      .post("/students")
      .set("x-family-id", "fam_1")
      .set("x-tenant-id", "tnt_1")
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

  it("POST /students sin x-tenant-id devuelve 400", async () => {
    const response = await request(app.getHttpServer())
      .post("/students")
      .set("x-family-id", "fam_1")
      .send({
        firstName: "Mateo",
        lastName: "Demo",
        grade: 6,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("x-tenant-id");
  });

  it("GET /students/:id sin x-family-id devuelve 403", async () => {
    const response = await request(app.getHttpServer()).get("/students/stu_1");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("FAMILY_CONTEXT_MISSING");
  });

  it("GET /students/:id con familia distinta devuelve 403", async () => {
    prismaMock.student.findFirst.mockResolvedValueOnce({ id: "stu_1", familyId: "fam_owner" });

    const response = await request(app.getHttpServer())
      .get("/students/stu_1")
      .set("x-family-id", "fam_intruder");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("FAMILY_ACCESS_DENIED");
  });

  it("GET /students/:id devuelve 404 cuando no existe", async () => {
    prismaMock.student.findFirst.mockResolvedValueOnce(null);

    const response = await request(app.getHttpServer())
      .get("/students/stu_404")
      .set("x-family-id", "fam_1");

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("STUDENT_NOT_FOUND");
  });

  it("GET /students/:id/progress devuelve agregados", async () => {
    prismaMock.student.findFirst.mockResolvedValue({ id: "stu_1", familyId: "fam_1", grade: 6 });
    prismaMock.studentProfile.findUnique.mockResolvedValue({
      id: "prof_1",
      strongSubjects: ["ciencias"],
      weakSubjects: ["matematica"],
      diagnosticCompleted: true,
    });

    const response = await request(app.getHttpServer())
      .get("/students/stu_1/progress")
      .set("x-family-id", "fam_1");

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      studentId: "stu_1",
      strengths: ["ciencias"],
      opportunities: ["matematica"],
      diagnosticCompleted: true,
    });
  });
});
