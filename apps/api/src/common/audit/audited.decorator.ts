import { SetMetadata } from "@nestjs/common";

export const AUDIT_METADATA_KEY = "educai:audit";

export interface AuditMetadata {
  /** Verbo en past tense, ej: "student.read", "student.created", "agent.run". */
  action: string;
  /** Nombre del modelo Prisma o concepto, ej: "Student", "Conversation". */
  entity: string;
  /** Param de la ruta del que extraer entityId. Default: "id". */
  paramKey?: string;
  /** Si true, se omite la entrada del entityId aunque el param exista. */
  skipEntityId?: boolean;
}

export const Audited = (metadata: AuditMetadata): MethodDecorator =>
  SetMetadata(AUDIT_METADATA_KEY, metadata);
