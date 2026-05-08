import { Injectable } from "@nestjs/common";
import { Prisma } from "@educai/database";
import type { Logger } from "pino";
import { AppLogger } from "../logger/app-logger.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";

export interface WriteAuditEntry {
  tenantId?: string | null;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Persistencia centralizada de AuditLog.
 *
 * Escribe con service_role porque el log de auditoria debe registrarse aun
 * cuando el actor no tenga permisos RLS sobre la entidad auditada (caso
 * tipico: SUPER_ADMIN viendo students fuera de su tenant). Falla silenciosa
 * con warn — auditoria no debe romper el flujo de usuario.
 */
@Injectable()
export class AuditLogService {
  private readonly log: Logger;

  constructor(
    private readonly prisma: PrismaService,
    logger: AppLogger,
  ) {
    this.log = logger.child({ component: "AuditLogService" });
  }

  async write(entry: WriteAuditEntry): Promise<void> {
    try {
      const metadataJson = (entry.metadata ?? {}) as Prisma.InputJsonValue;
      await this.prisma.withServiceRole((tx) =>
        tx.auditLog.create({
          data: {
            tenantId: entry.tenantId ?? null,
            actorId: entry.actorId ?? null,
            action: entry.action,
            entity: entry.entity,
            entityId: entry.entityId ?? null,
            metadata: metadataJson,
          },
        }),
      );
    } catch (error) {
      this.log.warn(
        {
          err: error instanceof Error ? error.message : String(error),
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
        },
        "audit_log.write_failed",
      );
    }
  }
}
