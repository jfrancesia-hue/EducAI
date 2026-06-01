import { describe, expect, it, vi, beforeEach } from "vitest";

import { TeacherCourseService } from "./teacher-course.service.js";

/**
 * Regresión: el rol `educai_app` no es service_role ni setea `app.tenant_id`, así
 * que las policies RLS del schema `educai` rechazan sus escrituras (INSERT → 500)
 * y filtran sus lecturas (SELECT → []) salvo que la transacción habilite el bypass
 * con `set_config('app.bypass_rls', 'true', true)`. Antes de este fix el servicio
 * hacía queries crudas sin bypass y `/app/estudiantes` estaba 100% roto en prod.
 */

const BYPASS_SQL = "SELECT set_config('app.bypass_rls', 'true', true)";

type TxMock = {
  $executeRawUnsafe: ReturnType<typeof vi.fn>;
  classroom: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

function buildTx(): TxMock {
  return {
    $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
    classroom: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
}

function buildPrismaMock(tx: TxMock) {
  return {
    // Reproduce la semántica de Prisma: ejecuta el callback con el tx y devuelve un thenable.
    $transaction: vi.fn((cb: (client: TxMock) => unknown) => Promise.resolve(cb(tx))),
  };
}

const loggerStub = {
  child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
} as unknown as ConstructorParameters<typeof TeacherCourseService>[1];

const context = { tenantId: "tenant-1", teacherId: "teacher-1", schoolId: "school-1" };

const baseRow = {
  id: "course-1",
  name: "7A",
  grade: 7,
  subject: "Ciencias Naturales",
  shift: "Mañana",
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("TeacherCourseService RLS bypass", () => {
  let tx: TxMock;
  let service: TeacherCourseService;

  beforeEach(() => {
    tx = buildTx();
    const prisma = buildPrismaMock(tx) as unknown as ConstructorParameters<
      typeof TeacherCourseService
    >[0];
    service = new TeacherCourseService(prisma, loggerStub);
  });

  it("create() habilita el bypass RLS dentro de la transacción antes del INSERT", async () => {
    tx.classroom.create.mockResolvedValue(baseRow);

    await service.create(
      { name: "7A", grade: 7, subject: "Ciencias Naturales", shift: "Mañana" },
      context,
    );

    expect(tx.$executeRawUnsafe).toHaveBeenCalledWith(BYPASS_SQL);
    expect(tx.classroom.create).toHaveBeenCalledTimes(1);
    // El bypass debe correr antes del write, no después.
    const bypassOrder = tx.$executeRawUnsafe.mock.invocationCallOrder[0] ?? Number.NaN;
    const writeOrder = tx.classroom.create.mock.invocationCallOrder[0] ?? Number.NaN;
    expect(bypassOrder).toBeLessThan(writeOrder);
  });

  it("list() habilita el bypass RLS antes del SELECT", async () => {
    tx.classroom.findMany.mockResolvedValue([baseRow]);

    const result = await service.list(context);

    expect(tx.$executeRawUnsafe).toHaveBeenCalledWith(BYPASS_SQL);
    expect(result.data).toHaveLength(1);
    const bypassOrder = tx.$executeRawUnsafe.mock.invocationCallOrder[0] ?? Number.NaN;
    const readOrder = tx.classroom.findMany.mock.invocationCallOrder[0] ?? Number.NaN;
    expect(bypassOrder).toBeLessThan(readOrder);
  });
});
