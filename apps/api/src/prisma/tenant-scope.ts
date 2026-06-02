import type { TenantRequestContext } from "./tenant-context.service.js";

/**
 * Modelos Prisma que llevan `tenantId` y por lo tanto DEBEN scopearse por tenant.
 * Cualquier acceso a uno de estos modelos sin tenant en contexto y sin un bypass
 * de sistema explícito se bloquea (fail-closed) para evitar cruce multi-tenant.
 */
export const TENANT_SCOPED_MODELS = new Set([
  "User",
  "Role",
  "School",
  "Family",
  "Parent",
  "Teacher",
  "Student",
  "Classroom",
  "Subject",
  "Enrollment",
  "StudentProfile",
  "EducaiWhatsappContact",
  "Conversation",
  "Message",
  "LearningSession",
  "Achievement",
  "ParentReport",
  "Subscription",
  "Curriculum",
  "CurriculumGap",
  "LessonPlan",
  "TeacherEnrollment",
  "CommunityPost",
  "CommunityComment",
  "AuditLog",
]);

/**
 * Acciones de Prisma que tocan filas y por ende deben ir scopeadas. Se listan de
 * forma explícita: si Prisma agrega una acción nueva sobre un modelo tenant-scoped
 * y no está acá, `applyTenantScope` la bloquea por defecto (fail-closed).
 */
const WHERE_SCOPED_ACTIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "upsert",
]);

export type TenantScopedMiddlewareParams = {
  model?: string;
  action: string;
  args?: unknown;
};

type MiddlewareArgs = Record<string, unknown> & {
  where?: unknown;
  create?: unknown;
  data?: unknown;
};

/**
 * Se lanza cuando una operación sobre un modelo tenant-scoped corre sin contexto de
 * tenant y sin bypass de sistema. Es un backstop de seguridad: o el token no traía
 * `tenantId`, o un flujo de sistema (webhook, onboarding, job) no declaró
 * `TenantContextService.runAsSystem()`. Preferimos fallar ruidosamente antes que
 * devolver datos de todos los tenants.
 */
export class TenantScopeRequiredError extends Error {
  readonly model: string;
  readonly action: string;

  constructor(model: string, action: string) {
    super(
      `Acceso bloqueado: '${action}' sobre el modelo tenant-scoped '${model}' sin contexto de ` +
        `tenant ni bypass de sistema. Indica un token sin tenantId o un flujo que no declaró ` +
        `TenantContextService.runAsSystem(). Se bloquea para evitar cruce multi-tenant.`,
    );
    this.name = "TenantScopeRequiredError";
    this.model = model;
    this.action = action;
  }
}

function withTenantId(where: unknown, tenantId: string): Record<string, unknown> {
  if (!where || typeof where !== "object" || Array.isArray(where)) {
    return { tenantId };
  }

  return {
    ...(where as Record<string, unknown>),
    tenantId,
  };
}

function withTenantData(data: unknown, tenantId: string): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return data;
  }

  return {
    ...(data as Record<string, unknown>),
    tenantId,
  };
}

/**
 * Aplica el scoping por tenant a los args de una operación Prisma, mutándolos in place.
 *
 * Reglas (fail-closed):
 *  - Modelo no tenant-scoped → no se toca nada.
 *  - Contexto con `bypass` (SUPER_ADMIN o `runAsSystem`) → no se scopea (acceso de sistema intencional).
 *  - Modelo tenant-scoped sin `tenantId` en contexto y sin bypass → THROW `TenantScopeRequiredError`.
 *  - En cualquier otro caso → se inyecta `tenantId` en `where`/`data`.
 *
 * @throws TenantScopeRequiredError cuando falta tenant y no hay bypass.
 */
export function applyTenantScope(
  params: TenantScopedMiddlewareParams,
  context: TenantRequestContext | undefined,
): void {
  if (!params.model || !TENANT_SCOPED_MODELS.has(params.model)) {
    return;
  }

  if (context?.bypass) {
    return;
  }

  const tenantId = context?.tenantId?.trim();
  if (!tenantId) {
    throw new TenantScopeRequiredError(params.model, params.action);
  }

  const args = (params.args ?? {}) as MiddlewareArgs;

  if (WHERE_SCOPED_ACTIONS.has(params.action)) {
    params.args = {
      ...args,
      where: withTenantId(args.where, tenantId),
    };

    if (params.action === "upsert" && args.create) {
      (params.args as MiddlewareArgs).create = withTenantData(args.create, tenantId);
    }
    return;
  }

  if (params.action === "create") {
    params.args = {
      ...args,
      data: withTenantData(args.data, tenantId),
    };
    return;
  }

  if (params.action === "createMany") {
    params.args = {
      ...args,
      data: Array.isArray(args.data)
        ? args.data.map((item) => withTenantData(item, tenantId))
        : withTenantData(args.data, tenantId),
    };
    return;
  }

  // Acción desconocida sobre un modelo tenant-scoped: no sabemos cómo inyectar el
  // tenant de forma segura, así que la bloqueamos en vez de dejarla pasar sin filtro.
  throw new TenantScopeRequiredError(params.model, params.action);
}
