import { describe, expect, it } from "vitest";

import {
  applyTenantScope,
  TENANT_SCOPED_MODELS,
  TenantScopeRequiredError,
  type TenantScopedMiddlewareParams,
} from "./tenant-scope.js";
import type { TenantRequestContext } from "./tenant-context.service.js";

function params(
  partial: Partial<TenantScopedMiddlewareParams> & { action: string },
): TenantScopedMiddlewareParams {
  return { model: "Student", args: {}, ...partial };
}

const TENANT: TenantRequestContext = { tenantId: "tnt_1" };

describe("applyTenantScope (fail-closed)", () => {
  describe("modelos NO tenant-scoped", () => {
    it("no toca los args ni lanza, aunque no haya tenant ni bypass", () => {
      const p = params({ model: "ContactLead", action: "findMany", args: { where: { x: 1 } } });
      expect(() => applyTenantScope(p, undefined)).not.toThrow();
      expect(p.args).toEqual({ where: { x: 1 } });
    });

    it("Tenant y otros modelos no listados quedan fuera del scoping", () => {
      for (const model of ["Tenant", "ContactLead", "BillingEvent", "ProcessedTwilioMessage"]) {
        const p = params({ model, action: "create", args: { data: { id: "x" } } });
        expect(() => applyTenantScope(p, undefined)).not.toThrow();
      }
    });
  });

  describe("sin tenant y sin bypass → BLOQUEA", () => {
    it("lanza TenantScopeRequiredError cuando el contexto es undefined", () => {
      const p = params({ action: "findMany" });
      expect(() => applyTenantScope(p, undefined)).toThrow(TenantScopeRequiredError);
    });

    it("lanza cuando el contexto existe pero no trae tenantId", () => {
      const p = params({ action: "findFirst" });
      expect(() => applyTenantScope(p, { role: "TEACHER" })).toThrow(TenantScopeRequiredError);
    });

    it("lanza cuando el tenantId es vacío o solo espacios", () => {
      const p = params({ action: "findMany" });
      expect(() => applyTenantScope(p, { tenantId: "   " })).toThrow(TenantScopeRequiredError);
    });

    it("bloquea también las escrituras (create) sin tenant", () => {
      const p = params({ action: "create", args: { data: { firstName: "Ana" } } });
      expect(() => applyTenantScope(p, undefined)).toThrow(TenantScopeRequiredError);
    });

    it("el error expone modelo y acción para diagnóstico", () => {
      const p = params({ model: "Subscription", action: "updateMany" });
      try {
        applyTenantScope(p, undefined);
        throw new Error("debería haber lanzado");
      } catch (error) {
        expect(error).toBeInstanceOf(TenantScopeRequiredError);
        expect((error as TenantScopeRequiredError).model).toBe("Subscription");
        expect((error as TenantScopeRequiredError).action).toBe("updateMany");
      }
    });
  });

  describe("con bypass de sistema → NO scopea, NO lanza", () => {
    it("deja pasar la query intacta cuando bypass=true", () => {
      const p = params({ action: "findMany", args: { where: { grade: 5 } } });
      applyTenantScope(p, { bypass: true, system: true });
      expect(p.args).toEqual({ where: { grade: 5 } });
    });

    it("permite crear sin inyectar tenantId bajo bypass (el flujo lo setea a mano)", () => {
      const p = params({ action: "create", args: { data: { firstName: "Ana" } } });
      applyTenantScope(p, { bypass: true });
      expect(p.args).toEqual({ data: { firstName: "Ana" } });
    });
  });

  describe("con tenant → inyecta tenantId", () => {
    it("findMany sin where previo", () => {
      const p = params({ action: "findMany" });
      applyTenantScope(p, TENANT);
      expect(p.args).toEqual({ where: { tenantId: "tnt_1" } });
    });

    it("findMany preservando un OR previo (queda AND-eado con tenantId)", () => {
      const p = params({
        action: "findMany",
        args: { where: { OR: [{ grade: 5 }, { grade: 6 }] } },
      });
      applyTenantScope(p, TENANT);
      expect(p.args).toEqual({
        where: { OR: [{ grade: 5 }, { grade: 6 }], tenantId: "tnt_1" },
      });
    });

    it("update por id agrega tenantId al where", () => {
      const p = params({ action: "update", args: { where: { id: "stu_1" }, data: { grade: 6 } } });
      applyTenantScope(p, TENANT);
      expect(p.args).toEqual({ where: { id: "stu_1", tenantId: "tnt_1" }, data: { grade: 6 } });
    });

    it("create inyecta tenantId en data", () => {
      const p = params({ action: "create", args: { data: { firstName: "Ana" } } });
      applyTenantScope(p, TENANT);
      expect(p.args).toEqual({ data: { firstName: "Ana", tenantId: "tnt_1" } });
    });

    it("createMany inyecta tenantId en cada item", () => {
      const p = params({
        action: "createMany",
        args: { data: [{ firstName: "Ana" }, { firstName: "Beto" }] },
      });
      applyTenantScope(p, TENANT);
      expect(p.args).toEqual({
        data: [
          { firstName: "Ana", tenantId: "tnt_1" },
          { firstName: "Beto", tenantId: "tnt_1" },
        ],
      });
    });

    it("upsert inyecta tenantId en where y en create", () => {
      const p = params({
        action: "upsert",
        args: { where: { id: "stu_1" }, create: { firstName: "Ana" }, update: { grade: 6 } },
      });
      applyTenantScope(p, TENANT);
      expect(p.args).toEqual({
        where: { id: "stu_1", tenantId: "tnt_1" },
        create: { firstName: "Ana", tenantId: "tnt_1" },
        update: { grade: 6 },
      });
    });

    it("acción desconocida sobre modelo tenant-scoped se bloquea aunque haya tenant", () => {
      const p = params({ action: "findRaw" });
      expect(() => applyTenantScope(p, TENANT)).toThrow(TenantScopeRequiredError);
    });
  });

  it("la lista de modelos scopeados incluye los sensibles principales", () => {
    for (const model of ["User", "Student", "Subscription", "Message", "ParentReport"]) {
      expect(TENANT_SCOPED_MODELS.has(model)).toBe(true);
    }
  });
});
