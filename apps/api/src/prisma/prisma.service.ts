import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@educai/database";

import { TenantContextService } from "./tenant-context.service.js";
import { applyTenantScope } from "./tenant-scope.js";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly tenantContext: TenantContextService) {
    super();

    this.$use(async (params, next) => {
      // Fail-closed: si el modelo es tenant-scoped y no hay tenant en contexto ni
      // bypass de sistema, `applyTenantScope` lanza y la operación nunca llega a la DB.
      applyTenantScope(params, this.tenantContext.get());
      const result: unknown = await next(params);
      return result;
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
