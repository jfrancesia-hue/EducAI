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
- el proximo corte es cerrar RBAC y normalizar claims por rol.

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
