/* eslint-disable */
/**
 * Sanity check del estado de la DB. Util como smoke post-migrate.
 *
 * Uso:
 *   DATABASE_URL_CHECK='postgresql://<role>:<pass>@<host>:5432/postgres?schema=public' \
 *     node packages/database/scripts/verify-supabase-state.mjs
 *
 * Mostra:
 *   - El rol con el que se conecta y si bypassea RLS (debe ser false para educai_app)
 *   - Tenants conocidos del seed
 *   - Counts por tabla relevante (incluye tablas nuevas: ParentalConsent,
 *     BillingEvent, ProcessedTwilioMessage)
 *
 * Si conectas como rol NOBYPASSRLS sin claims, todas las tablas con tenant
 * isolation devuelven 0 — eso es lo correcto, no un bug.
 */
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL_CHECK;
if (!url) {
  console.error("Set DATABASE_URL_CHECK to the connection string to test.");
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url } } });

try {
  const meta = await prisma.$queryRaw`
    select
      current_user as session_user,
      (select rolbypassrls from pg_roles where rolname = current_user) as bypassrls
  `;
  console.log("session:", meta);

  const tenants = await prisma.tenant.findMany({
    where: { slug: { in: ["familia-nativos-consultora", "familia-garcia-salta"] } },
    select: { id: true, slug: true },
  });
  console.log("seed tenants:", tenants);

  const counts = await prisma.$queryRaw`
    select
      (select count(*)::int from "Tenant") as tenants,
      (select count(*)::int from "Student") as students,
      (select count(*)::int from "ParentalConsent") as consents,
      (select count(*)::int from "BillingEvent") as billing_events,
      (select count(*)::int from "ProcessedTwilioMessage") as twilio_idem,
      (select count(*)::int from "Role") as roles,
      (select count(*)::int from "AuditLog") as audit
  `;
  console.log("counts:", counts);
} finally {
  await prisma.$disconnect();
}
