# Fase 0 — Setup del Monorepo EducAI

**Duración:** 2-3 días
**Objetivo:** Tener el esqueleto completo del monorepo funcionando, con CI/CD, linting, testing, y conexión a Supabase.

---

## Entregables de la fase

- Monorepo Turborepo con todas las apps y packages inicializados.
- Prisma schema base con multi-tenancy.
- Supabase configurado con RLS básico.
- CI/CD con GitHub Actions.
- Docker Compose para desarrollo local.
- Variables de entorno documentadas.

---

## Prompt para Claude Code

```
Actúa como un arquitecto senior de software especializado en SaaS multi-tenant con TypeScript, NestJS y Next.js.

Vas a crear el setup inicial del monorepo del proyecto EducAI LATAM. Lee primero el archivo 00-PROYECTO-MAESTRO.md para entender el contexto completo.

Tu tarea ahora es generar la estructura completa del monorepo Turborepo con lo siguiente:

## REQUERIMIENTOS

### 1. Estructura de carpetas
Crear la estructura exacta descrita en la sección 12 del documento maestro:

- apps/web (Next.js 14 App Router + TS + Tailwind + shadcn)
- apps/web como PWA instalable para mobile
- apps/gov-dashboard (Next.js 14 + Tremor)
- apps/api (NestJS + Prisma + Swagger)
- apps/whatsapp-agent (NestJS + Twilio)
- apps/worker (NestJS + BullMQ)
- packages/database (Prisma schema + migrations + seed)
- packages/ui (componentes shadcn compartidos)
- packages/ai (wrappers Claude + OpenAI + sistema de prompts)
- packages/types (tipos TS compartidos)
- packages/config (eslint-config, tsconfig-base, prettier)
- packages/i18n (es-AR, es-419, pt-BR, en-US, qu, gn como base)

### 2. Prisma Schema base (multi-tenant)

Generá el schema inicial con estos modelos, pensando en multi-tenancy estricto:

- Tenant (colegio o familia según el producto)
- User (con roles: SUPER_ADMIN, MINISTRY, SCHOOL_ADMIN, TEACHER, PARENT, STUDENT)
- Role y Permission (RBAC granular)
- School
- Family
- Student (relacionado a Family y opcionalmente a School)
- Parent
- Teacher
- Classroom
- Subject
- Enrollment

Todos los modelos deben tener:
- id (cuid)
- createdAt, updatedAt, deletedAt (soft delete)
- tenantId (cuando aplique) con índice
- Relaciones correctas con onDelete y onUpdate explícitos

### 3. Configuración de Supabase

- Archivo supabase/migrations/ con las políticas RLS iniciales por tenantId.
- Storage buckets: evidencias, portfolios, avatares (con políticas).
- Auth configurado con magic link + email/password.

### 4. Variables de entorno

Crear .env.example en cada app con todas las variables necesarias, agrupadas por servicio (Supabase, Claude, OpenAI, Twilio, MercadoPago, Stripe, Redis, etc.). Incluir comentarios explicando cada una.

### 5. Scripts de raíz

En package.json raíz:
- dev: turbo run dev
- build: turbo run build
- test: turbo run test
- lint: turbo run lint
- typecheck: turbo run typecheck
- db:migrate, db:seed, db:reset, db:studio
- docker:up, docker:down

### 6. Docker Compose para dev local

PostgreSQL 15 + Redis 7 + Mailhog (para emails de test).

### 7. CI/CD con GitHub Actions

- Workflow: lint + typecheck + test + build en cada PR.
- Workflow: deploy a Vercel (web, gov-dashboard) y Railway (api, whatsapp-agent, worker) en push a main.

### 8. Configuración compartida

- tsconfig base con strict mode.
- ESLint con reglas estrictas, import/order, unused vars como error.
- Prettier con configuración opinada.
- Husky + lint-staged para pre-commit.

### 9. Documentación

Crear README.md raíz explicando:
- Cómo clonar y arrancar localmente
- Comandos principales
- Estructura del monorepo
- Flujo de desarrollo (branches, PRs, commits convencionales)

Y un ADR-001-monorepo.md en docs/architecture/ explicando la decisión.

## REGLAS DE EJECUCIÓN

1. Generá todos los archivos reales, no placeholders.
2. El código debe estar en producción-ready desde ya (tipos estrictos, manejo de errores, logging).
3. Usá los últimos estables de cada dependencia (chequeá).
4. Comentarios en español donde aporten, nombres de variables y funciones en inglés.
5. Si una decisión arquitectónica es relevante, creá un ADR corto en docs/architecture/.
6. Después de crear todo, devolveme:
   - Árbol de archivos generados
   - Comandos exactos para levantar el proyecto localmente
   - Lista de servicios externos que debo crear manualmente (Supabase project, Twilio, etc.) con link de cada uno.

Arrancá.
```

---

## Checklist post-setup

Antes de pasar a Fase 1, verificar:

- [ ] `pnpm dev` levanta todas las apps sin errores
- [ ] Base de datos Supabase conectada y migraciones aplicadas
- [ ] Seeds corren OK con datos de ejemplo
- [ ] Tests unitarios pasan
- [ ] Typecheck pasa en todo el monorepo
- [ ] Lint pasa en todo el monorepo
- [ ] CI de GitHub Actions corre verde en un PR dummy
- [ ] Docker Compose levanta Postgres + Redis
- [ ] Variables de entorno documentadas en `.env.example`
