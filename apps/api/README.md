# @educai/api

API principal de EducAI LATAM. NestJS 10 + Prisma + PostgreSQL (Supabase) + Swagger.

## Módulos actuales (Fase 0)

- `health` — liveness check en `GET /health`.
- `students` — CRUD + diagnóstico (DTOs con class-validator).
- `curriculum` — CRUD + análisis de brechas (EducAI institucional).
- `lesson-plans` — CRUD + generación por IA (EducAI institucional).
- `prisma` — cliente Prisma como provider global.

Swagger disponible en `http://localhost:4000/docs`.

## Arranque local

```bash
# Desde la raíz del monorepo:
pnpm install
pnpm docker:up        # pgvector + redis + mailhog
pnpm db:migrate
pnpm db:seed
pnpm --filter @educai/api dev
```

`GET http://localhost:4000/health` → `{ status: "ok" }`.

## Variables de entorno

Copiar `.env.example` a `.env`. Variables críticas:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Postgres (default local via docker-compose). |
| `ANTHROPIC_API_KEY` | Claude API (motor pedagógico). |
| `OPENAI_API_KEY` | OpenAI (embeddings + OCR secundario). |
| `TWILIO_*` | Delegado a `whatsapp-agent`, pero útil para admin checks. |
| `MERCADOPAGO_*`, `STRIPE_*` | Pagos de suscripciones en Fase 1. |
| `SUPABASE_*` | Storage + Auth delegados a Supabase. |

## Fase siguiente (Fase 1)

Ver `docs/claude/02-FASE-1-APOYOAI.md` para los 5 prompts de ApoyoAI:
1. Schema + StudentModule completo con diagnóstico
2. Motor del tutor IA
3. Evaluación diagnóstica adaptativa
4. Suscripciones + pagos
5. Reportes semanales
