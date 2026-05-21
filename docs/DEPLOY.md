# Deploy

El workflow [`deploy.yml`](../.github/workflows/deploy.yml) dispara deploys reales por hooks HTTP y
falla de forma explicita si falta alguna configuracion productiva. El workflow confirma que los
hooks fueron disparados; la verificacion final del estado del deploy sigue ocurriendo del lado de
Vercel/Render.

## Secrets requeridos

Configurar estos secrets en GitHub Actions para el environment `production`:

- `VERCEL_WEB_DEPLOY_HOOK_URL`
- `VERCEL_GOV_DASHBOARD_DEPLOY_HOOK_URL`
- `RENDER_API_DEPLOY_HOOK_URL`

Si tenes `gh` autenticado, podes cargarlos desde:

- copiar [`ops/production/github.production.secrets.example.env`](../ops/production/github.production.secrets.example.env) a `ops/production/github.production.secrets.env`
- completar valores reales
- correr `powershell -ExecutionPolicy Bypass -File scripts/set-github-production-secrets.ps1`

## Destinos esperados

- `apps/web` -> Vercel
- `apps/gov-dashboard` -> Vercel
- `apps/api` -> Render, despliegue unico para API + webhook WhatsApp
- `apps/whatsapp-agent` -> legacy/local, no requiere servicio Render separado en produccion unica
- `apps/worker` -> legacy/local, no requiere servicio Render separado en produccion unica

## Variables de entorno productivas

Las listas de abajo incluyen:

- variables requeridas hoy para que el servicio arranque o cumpla su flujo actual
- variables reservadas para fases siguientes o integraciones todavia parciales

### `apps/api`

Requeridas hoy para boot y flujo productivo unico:

- `NODE_ENV=production`
- `DATABASE_URL` con rol app sin `BYPASSRLS` (`educai_app` directo o `educai_app.<project-ref>` por pooler) e incluyendo `schema=educai`
- `ALLOWED_ORIGINS`
- `PUBLIC_APP_URL`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` o `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_API_KEY_SID` + `TWILIO_API_KEY_SECRET`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_PUBLIC_WEBHOOK_URL=https://<api-render-url>/webhooks/twilio`
- `TWILIO_FORCE_PROTOCOL=https`
- `TWILIO_SKIP_SIGNATURE_VALIDATION=false`
- `TWILIO_DRY_RUN=false`
- `EDUCAI_AGENT_PROVIDER=anthropic`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `MERCADOPAGO_WEBHOOK_URL=https://<api-render-url>/webhooks/mercadopago` si se quiere informar la URL por preferencia ademas de configurarla en Mercado Pago

Opcionales:

- `EDUCAI_AGENT_MODEL`
- `SENTRY_DSN`
- `POSTHOG_KEY`

Template listo:

- [`ops/production/render.api.production.example.env`](../ops/production/render.api.production.example.env)

### Supabase compartido

El proyecto Supabase convive con IncluAI. EducAI debe operar siempre dentro del schema PostgreSQL
`educai`; `public` queda fuera de alcance. En produccion el API rechaza boot si `DATABASE_URL` no
incluye `schema=educai`.

### Limites y uso

La produccion inicial usa Supabase/Postgres para limites de WhatsApp y auditoria. El rate limit diario por alumno se calcula sobre `Message` del dia, sin Redis.

### `apps/web`

Requeridas hoy para login SSR y operacion del portal:

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Reservadas para fases siguientes o integraciones parciales:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`

Template listo:

- [`ops/production/vercel.web.production.example.env`](../ops/production/vercel.web.production.example.env)

### `apps/gov-dashboard`

Requeridas hoy para login SSR y operacion del panel:

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Reservadas para fases siguientes o integraciones parciales:

- `NEXT_PUBLIC_TENANT`
- `NEXT_PUBLIC_SENTRY_DSN`

Template listo:

- [`ops/production/vercel.gov-dashboard.production.example.env`](../ops/production/vercel.gov-dashboard.production.example.env)

### `apps/whatsapp-agent`

Legacy/local. En produccion unica, el webhook Twilio esta montado en `apps/api`.

### `apps/worker`

Legacy/local. En produccion unica inicial no se despliega worker ni Redis; los limites y eventos operativos se apoyan en Supabase/Postgres.

## Nota sobre Supabase compartido

EducAI comparte proyecto de Supabase con otra aplicacion, pero cualquier cambio productivo debe
limitarse a recursos, tenants y variables de entorno propios de EducAI. No reutilizar ni modificar
configuracion operativa de IncluAI.

## RLS y excepciones publicas

Las tablas multi-tenant deben vivir en el schema `educai` y quedar cubiertas por RLS basada en
`tenantId`. La excepcion actual explicita es `ContactLead`: intake comercial publico, sin datos de
menores y sin alcance tenant, por lo que no usa RLS y acepta escritura anonima desde `apps/web`.

## Chequeo rapido

Despues de completar los archivos de `ops/production`, podes validar faltantes con:

`powershell -ExecutionPolicy Bypass -File scripts/check-production-config.ps1`
