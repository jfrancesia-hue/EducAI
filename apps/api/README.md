# @educai/api

API principal de EducAI. NestJS 10 + Prisma + PostgreSQL.

## Modulos actuales

- `health` para liveness check.
- `students` para alta, consulta y diagnostico base.
- `curriculum` para carga y analisis institucional.
- `lesson-plans` para generacion y lectura de planificaciones.
- `prisma` como acceso global a base de datos.

## Estado actual

- la API builda, testea y documenta endpoints via Swagger;
- `students`, `curriculum` y `lesson-plans` ya validan sesion real via `Authorization: Bearer <token>` contra Supabase Auth;
- `webhooks/twilio` recibe WhatsApp en el mismo servicio Render de la API;
- los limites diarios de WhatsApp se calculan con Postgres/Supabase sobre `Message`;
- el proximo corte es cerrar RBAC y normalizar claims por rol.

Swagger disponible en `http://localhost:4000/docs`.

## Arranque local

```bash
pnpm --filter @educai/api dev
```

## Variables importantes

- `DATABASE_URL`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_PUBLIC_WEBHOOK_URL`
- `TWILIO_FORCE_PROTOCOL`
- `TWILIO_SKIP_SIGNATURE_VALIDATION`
- `TWILIO_DRY_RUN`

Ver `docs/DEPLOY.md`, `docs/SECRETS_MATRIX.md` y `docs/AUTH_READINESS.md`.

## Provision de usuarios de Auth

Para crear o actualizar usuarios de Supabase Auth desde el repo:

1. Copiar `scripts/auth-users.example.json`
2. Ajustar emails, password y claims
3. Ejecutar `pnpm auth:sync-users <ruta-al-json>`

El script usa `SUPABASE_URL` y `SUPABASE_SECRET_KEY` o `SUPABASE_SERVICE_ROLE_KEY`.
