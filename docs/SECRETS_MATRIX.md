# Secrets Matrix

Mapa operativo de variables por destino de despliegue.

## GitHub Actions `production`

Usadas por [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

- `VERCEL_WEB_DEPLOY_HOOK_URL`
- `VERCEL_GOV_DASHBOARD_DEPLOY_HOOK_URL`
- `RENDER_API_DEPLOY_HOOK_URL`
- `RENDER_WHATSAPP_AGENT_DEPLOY_HOOK_URL`
- `RENDER_WORKER_DEPLOY_HOOK_URL`

## Vercel `apps/web`

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`

## Vercel `apps/gov-dashboard`

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TENANT`
- `NEXT_PUBLIC_SENTRY_DSN`

## Render `apps/api`

- `NODE_ENV=production`
- `PORT`
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

## Render `apps/whatsapp-agent`

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
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `EDUCAI_API_URL`
- `EDUCAI_API_INTERNAL_TOKEN`
- `REDIS_URL`
- `SENTRY_DSN`

## Render `apps/worker`

- `NODE_ENV=production`
- `PORT`
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

## Notas

- `SUPABASE_URL` y sus keys deben pertenecer al espacio operativo de EducAI dentro del proyecto compartido.
- No reutilizar valores de IncluAI ni apuntar servicios de EducAI a tenants, buckets o flujos ya lanzados del otro producto.
- Si una variable existe pero todavia no esta cableada a codigo productivo, igual conviene cargarla si forma parte del contrato operativo esperado del servicio.
