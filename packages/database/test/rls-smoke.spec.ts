import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { withRlsClaims, withServiceRole } from "../src/rls.js";

// Preferimos DATABASE_URL_APP (rol NOBYPASSRLS) cuando esta seteada. Fallback a
// DATABASE_URL para devs locales contra Supabase con `postgres` superuser, en cuyo
// caso el smoke sigue siendo util pero solo como sanity check (ver
// docs/PRODUCTION-READINESS.md sobre el riesgo de bypass por superuser).
const RLS_DATABASE_URL = process.env.DATABASE_URL_APP ?? process.env.DATABASE_URL ?? "";
const SKIP = process.env.SKIP_RLS_SMOKE === "1" || RLS_DATABASE_URL.trim() === "";

const TENANT_A_SLUG = "familia-nativos-consultora";
const TENANT_B_SLUG = "familia-garcia-salta";

describe.skipIf(SKIP)("RLS smoke (aislamiento multi-tenant)", () => {
  let prisma: PrismaClient;
  let tenantA: { id: string };
  let tenantB: { id: string };
  let studentsCountA: number;
  let studentsCountB: number;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: RLS_DATABASE_URL } },
    });
    await prisma.$connect();

    const [a, b] = await withServiceRole(prisma, (tx) =>
      Promise.all([
        tx.tenant.findUnique({ where: { slug: TENANT_A_SLUG } }),
        tx.tenant.findUnique({ where: { slug: TENANT_B_SLUG } }),
      ]),
    );

    if (!a || !b) {
      throw new Error(
        `RLS smoke requiere seed previo: tenants '${TENANT_A_SLUG}' y '${TENANT_B_SLUG}'. ` +
          `Corre 'pnpm db:deploy && pnpm db:seed' antes de testear.`,
      );
    }

    tenantA = { id: a.id };
    tenantB = { id: b.id };

    [studentsCountA, studentsCountB] = await withServiceRole(prisma, (tx) =>
      Promise.all([
        tx.student.count({ where: { tenantId: tenantA.id } }),
        tx.student.count({ where: { tenantId: tenantB.id } }),
      ]),
    );

    if (studentsCountA === 0 || studentsCountB === 0) {
      throw new Error(
        `RLS smoke requiere students sembrados en ambos tenants. A=${studentsCountA}, B=${studentsCountB}.`,
      );
    }
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("tenant A solo ve sus propios students", async () => {
    const visible = await withRlsClaims(prisma, { role: "PARENT", tenant_id: tenantA.id }, (tx) =>
      tx.student.findMany({ select: { id: true, tenantId: true } }),
    );
    expect(visible.length).toBe(studentsCountA);
    expect(visible.every((s) => s.tenantId === tenantA.id)).toBe(true);
  });

  it("tenant B solo ve sus propios students", async () => {
    const visible = await withRlsClaims(prisma, { role: "PARENT", tenant_id: tenantB.id }, (tx) =>
      tx.student.findMany({ select: { id: true, tenantId: true } }),
    );
    expect(visible.length).toBe(studentsCountB);
    expect(visible.every((s) => s.tenantId === tenantB.id)).toBe(true);
  });

  it("tenant A no ve students de tenant B aun pidiendo por id", async () => {
    const idsB = await withServiceRole(prisma, (tx) =>
      tx.student.findMany({ where: { tenantId: tenantB.id }, select: { id: true } }),
    );
    expect(idsB.length).toBe(studentsCountB);

    const visible = await withRlsClaims(prisma, { role: "PARENT", tenant_id: tenantA.id }, (tx) =>
      tx.student.findMany({
        where: { id: { in: idsB.map((row) => row.id) } },
        select: { id: true },
      }),
    );
    expect(visible).toEqual([]);
  });

  it("subscriptions estan aisladas entre tenants", async () => {
    const subsA = await withRlsClaims(prisma, { role: "PARENT", tenant_id: tenantA.id }, (tx) =>
      tx.subscription.findMany({ select: { tenantId: true } }),
    );
    const subsB = await withRlsClaims(prisma, { role: "PARENT", tenant_id: tenantB.id }, (tx) =>
      tx.subscription.findMany({ select: { tenantId: true } }),
    );

    expect(subsA.every((s) => s.tenantId === tenantA.id)).toBe(true);
    expect(subsB.every((s) => s.tenantId === tenantB.id)).toBe(true);

    const idsA = new Set(subsA.map((s) => s.tenantId));
    const idsB = new Set(subsB.map((s) => s.tenantId));
    expect([...idsA].some((id) => idsB.has(id))).toBe(false);
  });

  it("service_role bypass: ve students de todos los tenants", async () => {
    const all = await withServiceRole(prisma, (tx) =>
      tx.student.findMany({ select: { id: true, tenantId: true } }),
    );
    expect(all.length).toBeGreaterThanOrEqual(studentsCountA + studentsCountB);

    const tenants = new Set(all.map((s) => s.tenantId));
    expect(tenants.has(tenantA.id)).toBe(true);
    expect(tenants.has(tenantB.id)).toBe(true);
  });

  it("sin claims (rol anonimo) la sesion no ve students", async () => {
    const visible = await withRlsClaims(prisma, { role: "anonymous" }, (tx) =>
      tx.student.findMany({ select: { id: true } }),
    );
    expect(visible).toEqual([]);
  });

  it("WITH CHECK: tenant A no puede insertar AuditLog con tenantId de B", async () => {
    await expect(
      withRlsClaims(prisma, { role: "PARENT", tenant_id: tenantA.id }, async (tx) => {
        await tx.auditLog.create({
          data: {
            tenantId: tenantB.id,
            action: "rls_smoke_violation_attempt",
            entity: "Student",
            metadata: {},
          },
        });
      }),
    ).rejects.toThrow();
  });

  it("Role: tenant A no ve roles tenant-scoped de B (pero si ve los globales)", async () => {
    const rolesB = await withServiceRole(prisma, (tx) =>
      tx.role.findMany({
        where: { tenantId: tenantB.id },
        select: { id: true, tenantId: true },
      }),
    );

    const visibleFromA = await withRlsClaims(
      prisma,
      { role: "ADMIN", tenant_id: tenantA.id },
      (tx) => tx.role.findMany({ select: { id: true, tenantId: true } }),
    );

    const visibleIds = new Set(visibleFromA.map((r) => r.id));
    for (const roleB of rolesB) {
      expect(visibleIds.has(roleB.id)).toBe(false);
    }

    expect(visibleFromA.every((r) => r.tenantId === null || r.tenantId === tenantA.id)).toBe(true);
  });
});
