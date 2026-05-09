import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Forma del claim que las policies de Postgres leen via
 * `current_setting('request.jwt.claims')::jsonb`. Mantener alineado con
 * `public.current_tenant_id()`, `public.current_user_id()` y
 * `public.is_service_role()` definidas en supabase/migrations/001_initial_rls.sql.
 */
export type RlsClaims = {
  sub?: string;
  role: string;
  tenant_id?: string;
  family_id?: string;
  school_id?: string;
  teacher_id?: string;
};

type RlsClient = Pick<PrismaClient, "$transaction">;

/**
 * Ejecuta `callback` dentro de una transaccion con `request.jwt.claims` seteado.
 * El `true` final del set_config limita el scope a la transaccion en curso.
 */
export function withRlsClaims<T>(
  prisma: RlsClient,
  claims: RlsClaims,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const serialized = JSON.stringify(claims);
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`select set_config('request.jwt.claims', ${serialized}, true)`;
    return callback(tx);
  });
}

export function withServiceRole<T>(
  prisma: RlsClient,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return withRlsClaims(prisma, { role: "service_role" }, callback);
}
