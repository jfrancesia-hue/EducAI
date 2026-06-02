import { describe, expect, it, vi } from "vitest";

import { HandoffService } from "./handoff.service.js";

function row(overrides: { id: string; createdAt: Date; metadata: Record<string, unknown> }) {
  return {
    id: overrides.id,
    tenantId: "tnt_1",
    entityId: `conv_${overrides.id}`,
    createdAt: overrides.createdAt,
    metadata: overrides.metadata,
  };
}

function buildService(rows: ReturnType<typeof row>[]) {
  const prisma = {
    auditLog: {
      findMany: vi.fn().mockResolvedValue(rows),
    },
  };
  return {
    service: new HandoffService(prisma as never),
    findMany: prisma.auditLog.findMany,
  };
}

const ROWS = [
  row({ id: "a", createdAt: new Date("2026-05-01"), metadata: { status: "open", reason: "duda" } }),
  row({
    id: "b",
    createdAt: new Date("2026-05-02"),
    metadata: { status: "open", crisisSeverity: "critical", safetySignals: ["crisis_suicide"] },
  }),
  row({
    id: "c",
    createdAt: new Date("2026-05-03"),
    metadata: { status: "closed", resolvedBy: "admin@x.com" },
  }),
];

describe("HandoffService", () => {
  it("list() por defecto devuelve solo activos y pone las crisis primero", async () => {
    const { service } = buildService(ROWS);

    const { data } = await service.list("tnt_1", false);

    expect(data.map((h) => h.id)).toEqual(["b", "a"]); // 'c' (closed) excluido; crisis 'b' primero
    expect(data[0]!.crisisSeverity).toBe("critical");
    expect(data.some((h) => h.status === "closed")).toBe(false);
  });

  it("list(includeResolved=true) incluye el historial de resueltos", async () => {
    const { service, findMany } = buildService(ROWS);

    const { data } = await service.list("tnt_1", true);

    expect(data).toHaveLength(3);
    expect(data.some((h) => h.id === "c" && h.status === "closed")).toBe(true);
    // Trae más filas cuando incluye historial.
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 300 }));
  });

  it("listOpen() es equivalente a list(tenantId, false)", async () => {
    const { service } = buildService(ROWS);

    const { data } = await service.listOpen("tnt_1");

    expect(data.map((h) => h.id)).toEqual(["b", "a"]);
  });
});
