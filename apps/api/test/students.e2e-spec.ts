import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Test } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import { createHmac } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

const TEST_JWT_SECRET = "test-secret-with-enough-length-for-auth";

function signToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", TEST_JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

const familyToken = signToken({
  sub: "usr_parent",
  tenantId: "tnt_1",
  role: "PARENT",
  familyId: "fam_1",
  exp: Math.floor(Date.now() / 1000) + 3600,
});

const prismaMock = {
  $connect: vi.fn().mockResolvedValue(undefined),
  $disconnect: vi.fn().mockResolvedValue(undefined),
  withUser: vi.fn(),
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
prismaMock.withUser.mockImplementation(
  (_user: unknown, callback: (db: typeof prismaMock) => unknown) => callback(prismaMock),
);

describe("Students API (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;

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

  it("POST /students rechaza body invalido (sin tenantId, grade fuera de rango)", async () => {
    const response = await request(app.getHttpServer())
      .post("/students")
      .set("Authorization", `Bearer ${familyToken}`)
      .send({ familyId: "fam_1", firstName: "X", lastName: "Y", grade: 99 });

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
      .set("Authorization", `Bearer ${familyToken}`)
      .send({
        tenantId: "tnt_1",
        familyId: "fam_1",
        firstName: "Mateo",
        lastName: "Garcia",
        grade: 6,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe("stu_new");
  });

  it("GET /students/:id sin token devuelve 401", async () => {
    const response = await request(app.getHttpServer()).get("/students/stu_1");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_TOKEN_MISSING");
  });

  it("GET /students/:id con familia distinta devuelve 403", async () => {
    prismaMock.student.findFirst.mockResolvedValueOnce({
      id: "stu_1",
      tenantId: "tnt_1",
      familyId: "fam_owner",
    });

    const response = await request(app.getHttpServer())
      .get("/students/stu_1")
      .set(
        "Authorization",
        `Bearer ${signToken({
          sub: "usr_intruder",
          tenantId: "tnt_1",
          role: "PARENT",
          familyId: "fam_intruder",
          exp: Math.floor(Date.now() / 1000) + 3600,
        })}`,
      );

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("FAMILY_ACCESS_DENIED");
  });

  it("GET /students/:id devuelve 404 cuando no existe", async () => {
    prismaMock.student.findFirst.mockResolvedValueOnce(null);

    const response = await request(app.getHttpServer())
      .get("/students/stu_404")
      .set("Authorization", `Bearer ${familyToken}`);

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("STUDENT_NOT_FOUND");
  });

  it("GET /students/:id/progress devuelve agregados", async () => {
    prismaMock.student.findFirst.mockResolvedValue({
      id: "stu_1",
      tenantId: "tnt_1",
      familyId: "fam_1",
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
      .set("Authorization", `Bearer ${familyToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      studentId: "stu_1",
      strengths: ["ciencias"],
      opportunities: ["matematica"],
      diagnosticCompleted: true,
    });
  });
});
