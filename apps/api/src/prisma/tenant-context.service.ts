import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantRequestContext {
  tenantId?: string;
  role?: string;
  /** Bypass del tenant-scoping. Solo para SUPER_ADMIN o flujos de sistema (`runAsSystem`). */
  bypass?: boolean;
  /** Marca que el bypass proviene de un flujo de sistema (webhook, onboarding, job), no de un rol. */
  system?: boolean;
}

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantRequestContext>();

  run<T>(context: TenantRequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  get(): TenantRequestContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Ejecuta `callback` con bypass de tenant-scoping explícito de sistema.
   *
   * Usar SOLO en flujos que legítimamente operan fuera de un tenant: webhooks
   * (Twilio/MercadoPago), onboarding (el usuario todavía no tiene tenant) y jobs
   * de mantenimiento (reaper). Todo lo demás debe correr con un `tenantId` real.
   */
  runAsSystem<T>(callback: () => T): T {
    return this.storage.run({ bypass: true, system: true }, callback);
  }

  /**
   * Ejecuta `callback` scopeado a un `tenantId` resuelto en runtime (no derivado de
   * la sesión). Útil cuando un flujo de sistema ya identificó el tenant del recurso
   * y quiere acotar el resto de la operación a ese tenant.
   */
  runWithTenant<T>(tenantId: string, callback: () => T): T {
    return this.storage.run({ tenantId }, callback);
  }
}
