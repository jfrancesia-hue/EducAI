# ADR-001 — Monorepo con Turborepo + pnpm

- **Status:** Aceptado
- **Fecha:** 2026-04-24
- **Fase:** 0 (Setup)

## Contexto

EducAI LATAM tiene dos productos (ApoyoAI B2C y EducAI B2B/B2G) que comparten el mismo dominio
(alumnos, docentes, colegios), la misma base de datos multi-tenant, los mismos modelos de IA y
una identidad visual común. Necesitamos distribuir el código en **6 aplicaciones** y **6
paquetes compartidos** sin que el equipo se mueva entre repos.

## Decisión

Usamos un **monorepo con Turborepo 2 + pnpm 9 workspaces**.

Motivos:

- **Turborepo 2** cachea builds, tests, lint y typecheck de forma remota + local; es el estándar
  de facto en SaaS JS/TS modernos.
- **pnpm workspaces** es el gestor con menor overhead para monorepos (hard links + store global),
  ideal para cold installs rápidos en CI.
- Permite **deps internas** (`workspace:*`) sin publicar a npm.
- Se integra bien con **Next.js 14/16** (via `transpilePackages`), **NestJS 10** y **Expo 51+**
  (via Metro `watchFolders`).
- Turborepo genera un grafo de dependencias explícito que da visibilidad clara al team.

## Alternativas consideradas

- **Nx**: más features (generators, computation caching propio) pero overhead de conceptos
  mayor y menos alineado con Next.js. Descartado por complejidad.
- **Yarn Workspaces**: pierde velocidad en CI vs pnpm. Descartado.
- **Poliglot monorepo (Nx + Bazel)**: overkill para el estado actual. Descartado.
- **Polyrepo**: rompería el single-source-of-truth de Prisma y AI. Descartado.

## Consecuencias

### Positivas
- Código compartido (`packages/database`, `packages/ai`, `packages/ui`, `packages/types`,
  `packages/i18n`, `packages/config`) usado por todas las apps sin duplicación.
- Turbo permite `pnpm test --filter @educai/api` para correr sólo lo tocado.
- CI corre lint + typecheck + test + build en un solo job, con caching.

### Negativas
- Curva inicial para devs nuevos que no conocen Turborepo.
- `pnpm install` pesa (muchas deps). Mitigación: `.pnpmfile.cjs` si hace falta tunear.
- Deploys separados por app (Vercel web + gov-dashboard; Render/Railway api + whatsapp-agent +
  worker; EAS mobile). CI distribuye con workflows separados (`.github/workflows/deploy.yml`).

## Estructura final

```
educai/
├── apps/
│   ├── api/                # NestJS 10 — API principal
│   ├── whatsapp-agent/     # NestJS 10 + Twilio — ApoyoAI
│   ├── worker/             # NestJS 10 + BullMQ — jobs asíncronos
│   ├── web/                # Next.js 14 — portal colegios + padres
│   ├── gov-dashboard/      # Next.js 14 + Tremor — ministerios
│   └── mobile/             # Expo 51 + React Native — alumnos/padres
├── packages/
│   ├── database/           # Prisma schema + migrations + seeds + client export
│   ├── ui/                 # shadcn compartido + tailwind preset
│   ├── ai/                 # Claude/OpenAI wrappers + prompts + safety filters
│   ├── types/              # tipos TS compartidos (UserRole, TenantType, etc.)
│   ├── i18n/               # es-AR default, es-419, pt-BR, en-US, qu, gn
│   └── config/             # eslint base + tsconfig base
├── docs/
│   ├── architecture/       # ADRs
│   └── claude/             # prompts de fases para Claude Code
├── supabase/
│   └── migrations/         # policies RLS + buckets + auth config
└── turbo.json
```
