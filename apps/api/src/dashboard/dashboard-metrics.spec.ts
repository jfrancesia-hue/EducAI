import { describe, expect, it, vi } from "vitest";

import { DashboardService } from "./dashboard.service.js";

function buildPrisma() {
  return {
    user: {
      // total, nuevos 30d, previos 30d (en ese orden dentro del Promise.all)
      count: vi.fn().mockResolvedValueOnce(100).mockResolvedValueOnce(10).mockResolvedValueOnce(5),
      findMany: vi.fn().mockResolvedValue([]),
    },
    tenant: {
      count: vi.fn().mockResolvedValue(10),
      findMany: vi
        .fn()
        .mockResolvedValue([{ metadata: { product: "educai", plan: "docente-pro" } }]),
    },
    school: { count: vi.fn().mockResolvedValue(3) },
    teacher: { count: vi.fn().mockResolvedValue(7) },
    student: { count: vi.fn().mockResolvedValue(40) },
    lessonPlan: { count: vi.fn().mockResolvedValue(25) },
    subscription: {
      findMany: vi.fn().mockResolvedValue([
        { product: "APOYOAI", planCode: "basico" },
        { product: "APOYOAI", planCode: "plus" },
        { product: "APOYOAI", planCode: "free" }, // sin precio: se ignora
      ]),
    },
    billingEvent: { findMany: vi.fn().mockResolvedValue([]) },
  };
}

describe("DashboardService.getMetricsOverview", () => {
  it("calcula MRR proyectado, paidCount y conversión desde subs activas + plan del tenant", async () => {
    const prisma = buildPrisma();
    const service = new DashboardService(prisma as never);

    const { data } = await service.getMetricsOverview();

    // basico 14900 + plus 34900 + docente-pro 24900 = 74700 (el plan free se ignora)
    expect(data.metrics.mrrArs).toBe(74_700);
    expect(data.metrics.arrArs).toBe(74_700 * 12);
    expect(data.metrics.paidCount).toBe(3);
    expect(data.metrics.userCount).toBe(100);
    // conversión = 3 pagos / 10 tenants = 30%
    expect(data.metrics.conversionPct).toBe(30);
    // crecimiento 30d = (10 - 5) / 5 = 100%
    expect(data.metrics.growth30dPct).toBe(100);
    // 3 planes pagos distintos en el breakdown
    expect(data.planBreakdown).toHaveLength(3);
    expect(data.newUsersByMonth).toHaveLength(12);
  });
});
