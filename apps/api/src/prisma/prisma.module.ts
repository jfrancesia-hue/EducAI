import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { TenantContextService } from "./tenant-context.service.js";

@Global()
@Module({
  providers: [TenantContextService, PrismaService],
  exports: [TenantContextService, PrismaService],
})
export class PrismaModule {}
