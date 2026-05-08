# EducAI Production Readiness

Estado auditado: 2026-05-07.

Proyecto Supabase objetivo: `https://mfjpoaipjlimzdxkusav.supabase.co`.

Estado Supabase actual:

- Migraciones Prisma aplicadas y baselined en Supabase: `001_init`,
  `002_diagnostic_state`, `enable_rls`, `role_rls`, `processed_twilio_message`,
  `parental_consent`, `billing_events` (todas verificadas el 2026-05-07).
- Seed de demo aplicado: 4 tenants (incluye `familia-nativos-consultora` y
  `familia-garcia-salta` requeridos para el smoke), 5 estudiantes con
  `StudentProfile`.
- Rol `educai_app` recreado el 2026-05-07 con NOBYPASSRLS y grants completos
  sobre `public` (incluido default privileges para tablas/secuencias/funciones
  futuras). Password rotada — no se commitea (ver `scripts/create-educai-app-role.sql`).
- `DATABASE_URL_APP` actualizado en `apps/api/.env` local con la password real
  del rol. Antes apuntaba al mismo postgres superuser, lo que invalidaba la
  defensa RLS.
- Smoke test RLS multi-tenant: **8/8 pasa contra Supabase prod real** con
  `DATABASE_URL_APP` apuntando a `educai_app`. Cubre aislamiento de Student,
  Subscription, AuditLog (WITH CHECK), Role y service_role bypass.
- `supabase/migrations/001_initial_rls.sql` aplicado contra Supabase.
- `supabase/migrations/002_storage_policies.sql` pendiente: confirmado que
  requiere admin SQL Editor del Dashboard porque la conexion `postgres` no es
  owner de `storage.objects` (error `must be owner of table objects`).

## Veredicto

EducAI no esta listo para produccion publica. La arquitectura base del monorepo es correcta, pero el producto todavia esta en fase piloto/validacion: hay seguridad multi-tenant parcialmente implementada, autenticacion propia provisoria, pantallas con mocks, billing incompleto, observabilidad ausente y poca cobertura automatizada fuera de API/WhatsApp/AI.

Un piloto cerrado de ApoyoAI/EducAI podria avanzar cuando se cierren los P0 de seguridad, auth, consentimiento, auditoria y smoke tests RLS. Produccion publica requiere completar P1/P2 y una validacion legal/pedagogica externa.

## Cambios aplicados en esta auditoria

- Se corrigio `supabase/migrations/001_initial_rls.sql`: reemplaza `CREATE POLICY IF NOT EXISTS` por checks contra `pg_policies`, porque Postgres no soporta `IF NOT EXISTS` en `CREATE POLICY`.
- Se alineo `packages/database/prisma/migrations/20260506100000_enable_rls/migration.sql` con la migracion Supabase.
- Se agrego RLS a tablas que estaban fuera del loop inicial: `Subject`, `Tenant`, `UserRoleAssignment`, `RolePermission`, `Permission`, `ContentLibraryItem` y `TeacherCourse`.
- Se corrigio el ADR multi-tenant para reflejar el mecanismo real: `request.jwt.claims` via `PrismaService.withUser(...)`.
- Se elimino aleatoriedad en tests de diagnostico adaptativo para evitar falsos rojos en CI.

## Cambios aplicados en esta segunda iteracion (2026-05-07)

- **Storage policies (`supabase/migrations/002_storage_policies.sql`)**: aislamiento por tenant via convencion de paths `{tenantId}/{...}` en los buckets `evidencias`, `portfolios` (privados) y `avatares` (lectura publica, escritura por tenant).
- **Smoke test RLS (`packages/database/test/rls-smoke.spec.ts`)**: valida 7 escenarios de aislamiento entre dos tenants reales del seed. Se skipea si no hay DB conectada.
- **Helpers RLS reutilizables (`packages/database/src/rls.ts`)**: `withRlsClaims()` y `withServiceRole()` exportados desde `@educai/database`.
- **CI con DB real**: aplica `prisma migrate deploy`, las migraciones SQL de Supabase, siembra y corre el smoke. Crea un rol `educai_app` NOBYPASSRLS para que el smoke no se ejecute como superuser.
- **Scripts de setup (`scripts/db-setup.sh` / `scripts/db-setup.ps1`)**: orquestan el setup completo contra el proyecto Supabase elegido.
- **ADR-003 auth**: documenta el waiver de piloto (HS256 propio) y el plan de migracion a Supabase Auth con custom claims hook.

## Hallazgo nuevo: superuser bypass de RLS en produccion

La `DATABASE_URL` que provee Supabase Dashboard conecta como rol `postgres` con
`BYPASSRLS`. Si la API NestJS conecta con esa URL, **todas las policies RLS son
ignoradas**, sin importar que `request.jwt.claims` se setee correctamente. La
defensa multi-tenant queda solo en el filtro de aplicacion.

Para que RLS sea efectivo en produccion, la API debe conectar con un rol
NOBYPASSRLS (equivalente a `authenticator` en Supabase). Acciones requeridas:

1. Crear rol `educai_app` (o usar `authenticator` de Supabase) con NOBYPASSRLS y
   GRANTs sobre `public`.
2. Cambiar `DATABASE_URL` de la API a la connection string de ese rol.
3. Mantener un `DATABASE_URL_ADMIN` (postgres superuser) solo para migraciones y
   tareas administrativas.

Este hallazgo se promueve a P0 antes de cualquier piloto con datos reales.

## Estado Por Area

### P0 Seguridad, Legal Y Multi-Tenant

| Area                    | Estado                      | Evidencia                                                                                                         | Riesgo                                                                                                                   |
| ----------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| RLS por tenant          | Verificado para tablas core | Migraciones aplicadas en Supabase y `packages/database/test/rls-smoke.spec.ts` pasa con `educai_app` NOBYPASSRLS. | Falta revisar/aplicar/verificar storage policies y asegurar `DATABASE_URL_APP` en CI/hosting.                            |
| Auth                    | Parcial/provisoria          | `JwtAuthGuard` valida HS256 con `JWT_SECRET`; Web tiene login local de fundador.                                  | No es Supabase Auth real, no valida JWKS, no hay signup/login multirol real ni link formal `auth.users.id` -> `User.id`. |
| RBAC                    | Parcial                     | Roles existen en Prisma y guard distingue roles elevados.                                                         | No hay permisos granulares aplicados por recurso; muchos controllers dependen solo de rol/tenant.                        |
| Consentimiento parental | Ausente funcionalmente      | `/privacidad`, `/terminos` y `/onboarding` existen, pero son paginas informativas.                                | No hay consentimiento persistido, versionado, auditable ni revocable.                                                    |
| AuditLog                | Modelo sin uso sistematico  | `AuditLog` existe en Prisma.                                                                                      | Guards y servicios no escriben accesos a datos de menores.                                                               |
| Privacidad y borrado    | Ausente funcionalmente      | Texto legal placeholder.                                                                                          | No hay endpoints de exportacion, borrado, retencion ni DPA.                                                              |

### P1 Producto Vendible

| Area                | Estado                    | Evidencia                                                                                                 | Riesgo                                                                                                                                         |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Billing             | Parcial y centrado en Web | Web crea Stripe Checkout directo y tiene webhook basico.                                                  | No hay modulo API `billing`, no hay MercadoPago, no persiste `Subscription`, webhook acepta eventos sin firma si falta secret, no hay dunning. |
| Web conectada a API | Mayormente mock           | `/app/estudiantes`, `/app/reportes` usan arrays locales; `/api/agent/run` llama Claude directo desde Web. | Drift de contratos, datos irreales, dificil medir uso real.                                                                                    |
| OpenAPI             | Parcial                   | Nest usa Swagger en dev.                                                                                  | `/docs` no se expone en produccion, no se genera/commitea JSON, no hay cliente tipado compartido.                                              |
| Worker              | Stub                      | `DiagnosticAnalysisProcessor` solo loguea y retorna.                                                      | Diagnostico async, informe y notificacion parental no existen.                                                                                 |

### P2 Operabilidad

| Area           | Estado        | Evidencia                                                              | Riesgo                                                                           |
| -------------- | ------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Observabilidad | Ausente       | Variables `SENTRY_DSN`/`POSTHOG_KEY` existen, no hay SDK inicializado. | Produccion opera a ciegas.                                                       |
| Health checks  | Basico        | `/health` devuelve `ok`.                                               | No chequea DB, Redis, colas ni proveedores IA.                                   |
| Rate limit     | Parcial       | API tiene guard in-memory; WhatsApp tiene servicio propio.             | No es distribuido, se resetea por proceso, no aplica cuotas por tenant en Redis. |
| Backups/DR     | No encontrado | No hay runbook.                                                        | Sin restauracion testeada ni PITR documentado.                                   |
| CI/CD          | Parcial       | CI corre lint/typecheck/test/build. Deploy es placeholder.             | CI no ejecuta migraciones ni smoke RLS; deploy no es real.                       |

### P2 Calidad Tecnica

| Area                  | Estado                    | Evidencia                                               | Riesgo                                                                    |
| --------------------- | ------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Tests                 | Parcial                   | 15 archivos spec/e2e encontrados en API, WhatsApp y AI. | Web, Gov, Mobile y Worker no tienen tests. No hay umbral 70% obligatorio. |
| A11y                  | No encontrado             | No hay Playwright/axe/lighthouse config.                | Riesgo WCAG alto antes de vender a instituciones.                         |
| Validacion pedagogica | Documentada, no ejecutada | `docs/claude/tutor-test-scenarios.md`.                  | Falta corrida humana, registro de hallazgos y ajustes de prompts.         |

### P3 Escala

| Area          | Estado    | Evidencia                                                                   | Riesgo                                       |
| ------------- | --------- | --------------------------------------------------------------------------- | -------------------------------------------- |
| RAG pgvector  | Ausente   | Extension `vector` existe; no hay modelos `Document`, `Chunk`, `Embedding`. | El tutor no recupera corpus curricular real. |
| Mobile        | Plantilla | Expo app minima.                                                            | No hay paridad funcional.                    |
| Gov Dashboard | Mock      | Dashboard sin queries reales agregadas.                                     | No sirve para piloto ministerial.            |
| i18n          | Parcial   | Paquete `@educai/i18n` existe con mensajes.                                 | Web no esta completamente extraida a `t()`.  |

## Nuevos Hallazgos Que No Estaban Claros En La Auditoria Original

1. La migracion Supabase de RLS tenia SQL invalido por `CREATE POLICY IF NOT EXISTS`.
2. `Tenant`, `Subject`, tablas RBAC y tablas de contenido global no estaban cubiertas por la migracion Prisma de RLS.
3. El ADR de multi-tenant estaba desactualizado: mencionaba `SET LOCAL app.tenant_id`, pero el codigo real usa `request.jwt.claims`. Quedo corregido en esta auditoria.
4. El webhook Stripe acepta eventos sin verificar firma cuando `STRIPE_WEBHOOK_SECRET` no esta configurado; en produccion deberia fallar cerrado.
5. El deploy workflow es solo placeholder, asi que no existe una ruta real controlada a produccion.
6. El CI no aplica `prisma migrate deploy` ni un smoke test RLS antes de correr tests.
7. El agente Web llama Anthropic directo desde Next.js; conviene moverlo a API para auth, auditoria, rate limit, costos y trazabilidad.
8. Hay texto mojibake visible en algunos archivos (`CurrÃ­culo`, `lÃ­mite`), senal de encoding a limpiar antes de pulir UX/docs.

## Orden Recomendado

### P0 Esta Semana

1. ~~Agregar smoke test RLS real con dos tenants y claims distintos.~~ **HECHO** (`packages/database/test/rls-smoke.spec.ts`).
2. ~~Migrar auth a Supabase Auth o, si se posterga, definir explicitamente que el JWT HS256 actual es solo para piloto local.~~ **HECHO** (`docs/architecture/ADR-003-auth-strategy.md`).
3. ~~Cambiar la `DATABASE_URL` de la API a un rol NOBYPASSRLS (ver hallazgo de superuser bypass arriba).~~ **HECHO localmente** con `DATABASE_URL_APP`; falta replicarlo en hosting/CI.
4. Aplicar/verificar `002_storage_policies.sql` al proyecto Supabase real desde SQL Editor/admin.
5. Escribir `AuditLog` desde guards/servicios de acceso a estudiantes, conversaciones, mensajes y reportes.
6. Persistir consentimiento parental: version legal, actor, estudiante, IP, user agent y timestamp.
7. Hacer que Stripe webhook falle si falta `STRIPE_WEBHOOK_SECRET` en entorno no local.

Ver tambien `docs/SUPABASE-SETUP.md` para las variables del proyecto Supabase elegido.

### P1 Luego Del P0

1. Crear `apps/api/src/billing` con Checkout/Preference, webhooks y persistencia de `Subscription`.
2. Publicar OpenAPI JSON en CI y generar cliente tipado para Web.
3. Reemplazar mocks de `/app/estudiantes` y `/app/reportes` por endpoints reales.
4. Implementar `DiagnosticAnalysisProcessor` con escritura de resultado y notificacion.

### P2 Para Operar

1. Inicializar Sentry en API, Web, WhatsApp y Worker.
2. Inicializar PostHog con eventos minimos: signup, consentimiento, primer mensaje, checkout, paid, churn.
3. Cambiar rate limit de API a Redis con cuotas por tenant.
4. Agregar checks DB/Redis/LLM en readiness.
5. Documentar backups, PITR y restore drill.

## Criterio De Salida Para Piloto Cerrado

- RLS smoke test pasa en CI con `DATABASE_URL_APP`.
- Auth real o waiver explicito firmado para piloto local controlado.
- Consentimiento parental persistido y auditable.
- AuditLog escrito para accesos a datos de menores.
- Billing cerrado para al menos un provider o piloto gratuito documentado.
- Health/readiness y Sentry activos.
- Tutor validado con escenarios pedagogicos y crisis.
