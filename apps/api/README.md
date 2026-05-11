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
- varios endpoints sensibles ya no aceptan identidad arbitraria en body;
- el contexto sensible sigue siendo provisorio en headers hasta integrar auth real.

Swagger disponible en `http://localhost:4000/docs`.

## Arranque local

```bash
pnpm --filter @educai/api dev
```

## Variables importantes

- `DATABASE_URL`
- `ANTHROPIC_API_KEY`
- `REDIS_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Ver `docs/DEPLOY.md`, `docs/SECRETS_MATRIX.md` y `docs/AUTH_READINESS.md`.
