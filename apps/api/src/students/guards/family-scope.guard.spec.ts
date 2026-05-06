import { describe, expect, it, vi } from "vitest";
import type { ExecutionContext } from "@nestjs/common";
import { FamilyScopeGuard } from "./family-scope.guard.js";

function contextFor(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe("FamilyScopeGuard", () => {
  it("rechaza acceso a estudiante de otro tenant", async () => {
    const prisma = {
      withUser: vi.fn(),
      student: {
        findFirst: vi.fn().mockResolvedValue({
          id: "stu_1",
          tenantId: "tnt_other",
          familyId: "fam_1",
        }),
      },
    };
    prisma.withUser.mockImplementation((_user: unknown, callback: (db: typeof prisma) => unknown) =>
      callback(prisma),
    );
    const guard = new FamilyScopeGuard(prisma as never);

    await expect(
      guard.canActivate(
        contextFor({
          user: { sub: "usr_1", tenantId: "tnt_1", role: "PARENT", familyId: "fam_1" },
          params: { id: "stu_1" },
        }),
      ),
    ).rejects.toMatchObject({ response: { code: "TENANT_ACCESS_DENIED" } });
  });

  it("rechaza acceso a estudiante de otra familia en el mismo tenant", async () => {
    const prisma = {
      withUser: vi.fn(),
      student: {
        findFirst: vi.fn().mockResolvedValue({
          id: "stu_1",
          tenantId: "tnt_1",
          familyId: "fam_owner",
        }),
      },
    };
    prisma.withUser.mockImplementation((_user: unknown, callback: (db: typeof prisma) => unknown) =>
      callback(prisma),
    );
    const guard = new FamilyScopeGuard(prisma as never);

    await expect(
      guard.canActivate(
        contextFor({
          user: { sub: "usr_1", tenantId: "tnt_1", role: "PARENT", familyId: "fam_intruder" },
          params: { id: "stu_1" },
        }),
      ),
    ).rejects.toMatchObject({ response: { code: "FAMILY_ACCESS_DENIED" } });
  });
});
