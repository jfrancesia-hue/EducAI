# Secrets Matrix

Mapa unico de variables por destino de despliegue. No guardar valores reales en git.

## Variables compartidas

Estas keys se cargan una sola vez por servicio que las use; no hacen falta nombres duplicados.

### Supabase y base de datos

- `DATABASE_URL`: conexion PostgreSQL para Prisma. En produccion debe usar un rol app sin `BYPASSRLS`; no usar `postgres`.
- `SUPABASE_URL`: URL del proyecto Supabase operativo de EducAI.
- `SUPABASE_SECRET_KEY`: service role o key elevada para validar usuarios desde backend.
- `SUPABASE_SERVICE_ROLE_KEY`: fallback legacy si no se usa `SUPABASE_SECRET_KEY`.
- `SUPABASE_ANON_KEY`: anon key para integraciones backend que la pidan.
- `NEXT_PUBLIC_SUPABASE_URL`: URL publica de Supabase para Next.js.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon key publica para Next.js.
- `EXPO_PUBLIC_SUPABASE_URL`: URL publica de Supabase para mobile.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: anon key publica para mobile.

### IA

- `ANTHROPIC_API_KEY`: Claude para tutor, OCR, diagnostico y planificaciones.
- `OPENAI_API_KEY`: Whisper para audio y futuros embeddings.
- `EDUCAI_AGENT_PROVIDER`: proveedor del agente WhatsApp, usar `anthropic` en produccion.
- `EDUCAI_AGENT_MODEL`: override manual, dejar vacio salvo debug puntual.

### WhatsApp / Twilio

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_PUBLIC_WEBHOOK_URL`
- `TWILIO_FORCE_PROTOCOL`
- `TWILIO_SKIP_SIGNATURE_VALIDATION`
- `TWILIO_DRY_RUN`

### Mercado Pago

- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`

> Stripe queda fuera por decision de producto actual.

### Infra, observabilidad y URLs

- `NODE_ENV`
- `PORT`
- `PUBLIC_APP_URL`
- `ALLOWED_ORIGINS`
- `NEXT_PUBLIC_API_URL`
- `EXPO_PUBLIC_API_URL`
- `REDIS_URL`
- `BULL_QUEUE_PREFIX`
- `LOG_LEVEL`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `EXPO_PUBLIC_SENTRY_DSN`
- `POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `EXPO_PUBLIC_POSTHOG_KEY`

### Worker y mensajeria futura

- `RESEND_API_KEY`
- `REPORTS_FROM_EMAIL`

## Vercel `apps/web`

Minimo para que la web y el flujo docente funcionen:

- `NEXT_PUBLIC_APP_NAME=EducAI`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Opcionales:

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`

## Vercel `apps/gov-dashboard`

Minimo:

- `NEXT_PUBLIC_APP_NAME=EducAI Gov`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Opcionales:

- `NEXT_PUBLIC_TENANT`
- `NEXT_PUBLIC_SENTRY_DSN`

## Expo `apps/mobile`

Minimo cuando mobile entre en alcance:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Opcionales:

- `EXPO_PUBLIC_POSTHOG_KEY`
- `EXPO_PUBLIC_SENTRY_DSN`

## Render `apps/api`

Minimo para produccion:

- `NODE_ENV=production`
- `PORT`
- `PUBLIC_APP_URL`
- `ALLOWED_ORIGINS`
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` o `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

Necesarias para las proximas fases:

- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `REDIS_URL`

Opcionales:

- `SENTRY_DSN`
- `POSTHOG_KEY`

## Render `apps/whatsapp-agent`

Minimo para produccion:

- `NODE_ENV=production`
- `PORT`
- `DATABASE_URL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_PUBLIC_WEBHOOK_URL`
- `TWILIO_FORCE_PROTOCOL=https`
- `TWILIO_SKIP_SIGNATURE_VALIDATION=false`
- `TWILIO_DRY_RUN=false`
- `EDUCAI_AGENT_PROVIDER=anthropic`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`

Proximas fases:

- `REDIS_URL`
- `EDUCAI_API_URL`
- `EDUCAI_API_INTERNAL_TOKEN`

Opcionales:

- `EDUCAI_AGENT_MODEL`
- `SENTRY_DSN`

## Render `apps/worker`

Minimo:

- `NODE_ENV=production`
- `PORT`
- `REDIS_URL`

Proximas fases:

- `DATABASE_URL`
- `BULL_QUEUE_PREFIX`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `RESEND_API_KEY`
- `REPORTS_FROM_EMAIL`
- `SENTRY_DSN`

## GitHub Actions `production`

Usadas por [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

- `VERCEL_WEB_DEPLOY_HOOK_URL`
- `VERCEL_GOV_DASHBOARD_DEPLOY_HOOK_URL`
- `RENDER_API_DEPLOY_HOOK_URL`
- `RENDER_WHATSAPP_AGENT_DEPLOY_HOOK_URL`
- `RENDER_WORKER_DEPLOY_HOOK_URL`

## Keys que hay que pedir antes de cerrar produccion

- Anthropic: `ANTHROPIC_API_KEY`
- OpenAI: `OPENAI_API_KEY`
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
- Twilio webhook publico: `TWILIO_PUBLIC_WEBHOOK_URL`
- Mercado Pago: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`
- Redis/Upstash: `REDIS_URL`
- App URLs finales: `PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `ALLOWED_ORIGINS`
- Deploy hooks si se usa GitHub Actions: `VERCEL_*_DEPLOY_HOOK_URL`, `RENDER_*_DEPLOY_HOOK_URL`

## Notas operativas

- `DATABASE_URL` de produccion no debe usar el usuario `postgres`.
- Las keys publicas (`NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`) pueden vivir en cliente; las demas no.
- No reutilizar valores de IncluAI salvo que se decida explicitamente compartir infraestructura.
- `SUPABASE_SECRET_KEY` y `SUPABASE_SERVICE_ROLE_KEY` representan el mismo rol operativo; usar una sola como fuente principal.
