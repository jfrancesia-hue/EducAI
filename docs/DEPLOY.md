# Deploy

El workflow [`deploy.yml`](../.github/workflows/deploy.yml) dispara deploys reales por hooks HTTP y
falla de forma explicita si falta alguna configuracion productiva. Esto evita falsos positivos en
`main`.

## Secrets requeridos

Configurar estos secrets en GitHub Actions para el environment `production`:

- `VERCEL_WEB_DEPLOY_HOOK_URL`
- `VERCEL_GOV_DASHBOARD_DEPLOY_HOOK_URL`
- `RENDER_API_DEPLOY_HOOK_URL`
- `RENDER_WHATSAPP_AGENT_DEPLOY_HOOK_URL`
- `RENDER_WORKER_DEPLOY_HOOK_URL`

## Destinos esperados

- `apps/web` -> Vercel
- `apps/gov-dashboard` -> Vercel
- `apps/api` -> Render
- `apps/whatsapp-agent` -> Render
- `apps/worker` -> Render

## Variables de entorno productivas

Las listas de abajo incluyen:

- variables requeridas hoy para que el servicio arranque o cumpla su flujo actual
- variables reservadas para fases siguientes o integraciones todavia parciales

### `apps/api`

Requeridas hoy para boot:

- `NODE_ENV=production`
- `DATABASE_URL`
- `ALLOWED_ORIGINS`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Reservadas para fases siguientes o integraciones parciales:

- `NODE_ENV=production`
- `PUBLIC_APP_URL`
- `ALLOWED_ORIGINS`
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `REDIS_URL`
- `SENTRY_DSN`
- `POSTHOG_KEY`

### `apps/web`

Hoy estas variables siguen documentadas, pero la app todavia no las consume en codigo productivo.

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`

### `apps/gov-dashboard`

Hoy estas variables siguen documentadas, pero la app todavia no las consume en codigo productivo.

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TENANT`
- `NEXT_PUBLIC_SENTRY_DSN`

### `apps/whatsapp-agent`

Requeridas hoy para boot y flujo actual:

- `NODE_ENV=production`
- `DATABASE_URL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_PUBLIC_WEBHOOK_URL`
- `TWILIO_FORCE_PROTOCOL`
- `TWILIO_SKIP_SIGNATURE_VALIDATION=false`
- `TWILIO_DRY_RUN=false`
- `ANTHROPIC_API_KEY`

Reservadas para fases siguientes o integraciones parciales:

- `NODE_ENV=production`
- `DATABASE_URL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_PUBLIC_WEBHOOK_URL`
- `TWILIO_FORCE_PROTOCOL`
- `TWILIO_SKIP_SIGNATURE_VALIDATION=false`
- `TWILIO_DRY_RUN=false`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `EDUCAI_API_URL`
- `EDUCAI_API_INTERNAL_TOKEN`
- `REDIS_URL`
- `SENTRY_DSN`

### `apps/worker`

Requeridas hoy para boot:

- `NODE_ENV=production`
- `REDIS_URL`

Reservadas para fases siguientes o integraciones parciales:

- `NODE_ENV=production`
- `DATABASE_URL`
- `REDIS_URL`
- `BULL_QUEUE_PREFIX`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `REPORTS_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `SENTRY_DSN`

## Nota sobre Supabase compartido

EducAI comparte proyecto de Supabase con otra aplicacion, pero cualquier cambio productivo debe
limitarse a recursos, tenants y variables de entorno propios de EducAI. No reutilizar ni modificar
configuracion operativa de IncluAI.
