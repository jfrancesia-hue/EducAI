import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantRequestContext {
  tenantId?: string;
  role?: string;
  bypass?: boolean;
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
}
