# EducAI LATAM

> **El sistema operativo de la escuela moderna.**

Plataforma SaaS multi-producto que moderniza la educación en LATAM conectando alumnos, padres, docentes, colegios y gobiernos con IA pedagógica, evaluación por competencias y analítica predictiva.

**Empresa:** Nativos Consultora Digital
**Mercado:** Argentina (NOA) → LATAM → emergentes

## Productos

| Producto    | Segmento                         | Canal            | Ticket                              |
| ----------- | -------------------------------- | ---------------- | ----------------------------------- |
| **ApoyoAI** | Familias (B2C)                   | WhatsApp + app   | USD 6-20 / mes                      |
| **EducAI**  | Colegios + Ministerios (B2B/B2G) | Web + dashboards | USD 2-5 / alumno o USD 50k-2M / año |

## Stack

- **Monorepo:** Turborepo + pnpm
- **Frontend:** Next.js 14 (App Router) + TailwindCSS + shadcn/ui · Expo React Native para mobile
- **Backend:** NestJS + Prisma + PostgreSQL (Supabase) + BullMQ + Redis
- **IA:** Claude API (Anthropic) + OpenAI + pgvector (RAG) + Whisper + Claude Vision
- **Mensajería:** Twilio (WhatsApp)
- **Pagos:** MercadoPago (LATAM) · Stripe (internacional)
- **Infra:** Vercel + Render + EAS + Sentry + PostHog

## Estructura del monorepo

```
educai/
├── apps/
│   ├── web/             # Portal colegios + padres (Next.js)
│   ├── mobile/          # App alumnos + padres (Expo RN)
│   ├── gov-dashboard/   # Dashboard ministerial (Next.js + Tremor)
│   ├── api/             # API principal (NestJS)
│   ├── whatsapp-agent/  # Agente tutor WhatsApp (NestJS + Twilio)
│   └── worker/          # Jobs asíncronos (BullMQ)
├── packages/
│   ├── database/        # Prisma schema + migrations + seeds
│   ├── ui/              # Componentes shadcn compartidos
│   ├── ai/              # Wrappers Claude/OpenAI + prompts curados
│   ├── types/           # Tipos TypeScript compartidos
│   ├── config/          # eslint, tsconfig, prettier
│   └── i18n/            # Traducciones (es-AR, es-419, pt-BR, en-US, qu, gn)
└── docs/
    ├── architecture/    # ADRs
    ├── api/             # OpenAPI specs
    ├── pedagogy/        # Validación pedagógica + prompts curados
    └── claude/          # Prompts de fases para Claude Code
```

## Roadmap

| Fase | Duración  | Objetivo                            | Doc                                                                                |
| ---- | --------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| 0    | 2-3 días  | Setup monorepo + infraestructura    | [`docs/claude/01-FASE-0-SETUP.md`](docs/claude/01-FASE-0-SETUP.md)                 |
| 1    | 10-12 sem | MVP ApoyoAI — Tutor IA por WhatsApp | [`docs/claude/02-FASE-1-APOYOAI.md`](docs/claude/02-FASE-1-APOYOAI.md)             |
| 2    | 10-12 sem | MVP EducAI institucional            | [`docs/claude/03-FASE-2-EDUCAI.md`](docs/claude/03-FASE-2-EDUCAI.md)               |
| 3    | 8 sem     | Módulos transversales               | [`docs/claude/04-FASE-3-EXPANSION.md`](docs/claude/04-FASE-3-EXPANSION.md)         |
| 4    | 16 sem    | B2G + expansión regional            | [`docs/claude/05-FASE-4-B2G-EXPANSION.md`](docs/claude/05-FASE-4-B2G-EXPANSION.md) |

Ver [`CLAUDE.md`](CLAUDE.md) para el contexto completo de la IA de desarrollo.
Ver [`docs/DEPLOY.md`](docs/DEPLOY.md) para la configuracion de deploy productivo por hooks.
Ver [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md) para la salida operativa a produccion.
Ver [`docs/AUTH_READINESS.md`](docs/AUTH_READINESS.md) para el estado real de auth y tenants.

## Desarrollo local

> Setup completo disponible al finalizar la Fase 0.

```bash
# Clonar
git clone https://github.com/jfrancesia-hue/EducAI.git
cd EducAI

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# ... etc

# Levantar servicios locales (Postgres + Redis + Mailhog)
pnpm docker:up

# Migrar base de datos
pnpm db:migrate
pnpm db:seed

# Levantar todas las apps
pnpm dev
```

## Principios de desarrollo

1. Production-ready siempre — no prototipos, no demos.
2. Multi-tenant desde día 1 (schoolId, familyId, RLS estricto).
3. Seguridad de menores no negociable (Ley 26.061, LGPD, COPPA).
4. Seguridad pedagógica del tutor IA: método socrático, nunca respuesta directa.
5. Cobertura de tests ≥ 70% en lógica de negocio.
6. WCAG 2.1 AA en todas las UIs.
7. I18n-ready desde el primer commit.
8. Offline-first en mobile.

## Licencia

Privado — Nativos Consultora Digital © 2026
