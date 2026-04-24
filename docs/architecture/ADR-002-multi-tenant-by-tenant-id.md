# ADR-002 — Multi-tenant por `tenantId` con RLS en Supabase

- **Status:** Aceptado
- **Fecha:** 2026-04-24
- **Fase:** 0 (Setup)

## Contexto

EducAI LATAM sirve tres tipos de tenant:

1. **Familia** (consumer ApoyoAI B2C) — la unidad facturable.
2. **Colegio** (institucional EducAI B2B) — agrupa docentes, alumnos, aulas, currículo.
3. **Ministerio** (gov EducAI B2G) — agrega datos de múltiples colegios bajo su jurisdicción.

La seguridad de menores es no negociable (Ley 26.061 AR, LGPD BR, COPPA). Un leak entre tenants
sería un incidente de compliance grave.

## Decisión

- Un único **modelo `Tenant`** con enum `TenantType { SCHOOL, FAMILY, MINISTRY }`.
- Cada modelo de negocio (User, Student, Parent, Teacher, Classroom, Conversation, etc.) tiene
  una columna `tenantId: String` indexada.
- **Row Level Security (RLS) habilitado** en todas las tablas con una política de tipo
  `tenantId = current_setting('app.tenant_id')::text`.
- La API NestJS setea `SET LOCAL app.tenant_id` al inicio de cada transacción según el JWT.
- Excepciones con `tenantId: null`:
  - `Permission` (globales, sólo escritura por super-admin).
  - `ContentLibraryItem` y `TeacherCourse` (biblioteca pública de EducAI, lectura libre).
  - `CommunityPost` y `CommunityComment` dependiendo de visibilidad (TBD en Fase 3).

## Alternativas consideradas

- **Schema por tenant (PostgreSQL schemas):** escala mal a 10k+ colegios (overhead de conexiones).
  Descartado.
- **Database por tenant:** operacionalmente inviable para B2C masivo. Descartado.
- **Row-level filtering sólo en app:** no suficiente; single bug en un WHERE filtra datos.
  Descartado por compliance.
- **Postgres + pg_rls app-side + RLS:** adoptado. RLS es la última barrera; filtros en app son
  defensa en profundidad.

## Consecuencias

### Positivas
- Un solo schema + migrations. Simplifica DX.
- RLS protege contra bugs de query en app layer.
- Supabase soporta RLS nativo + pgvector.

### Negativas
- Todo query debe setear `SET LOCAL app.tenant_id` o bypass explícito con service role.
- Debugging en dev requiere awareness: `prisma.migrate reset` es seguro por RLS, pero producción
  exige super-admin role con `BYPASSRLS`.
- Tests e2e deben simular JWT + tenant context.

## Primera migración

Ver `supabase/migrations/001_initial_rls.sql`. Políticas base cubren SELECT/INSERT/UPDATE/DELETE
por `tenantId`. Roles con permisos elevados (`SUPER_ADMIN`, `MINISTRY`) agregan políticas
adicionales en fases posteriores.

## Referencias

- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Prisma + RLS: https://www.prisma.io/docs/orm/prisma-client/queries/raw-database-access/native-database-functions
- Ley 26.061 Argentina (Protección Integral de Niñas, Niños y Adolescentes).
