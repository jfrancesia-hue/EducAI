# EducAI LATAM — Contexto del Proyecto

> Documento raíz de contexto para Claude Code. El detalle completo vive en `docs/claude/`.

---

## Visión

**EducAI LATAM** es el sistema operativo de la educación moderna para países en desarrollo. Plataforma SaaS que conecta **alumnos, padres, docentes, colegios y gobiernos** bajo un mismo ecosistema, con IA pedagógica, evaluación por competencias, analítica predictiva e impacto social real.

- **Tagline:** "El sistema operativo de la escuela moderna."
- **Empresa:** Nativos Consultora Digital
- **Mercado:** Argentina (NOA) → LATAM → emergentes
- **Modelo:** B2C (padres) + B2B (colegios) + B2B2C + B2G (gobiernos) + fondos de impacto

## Dos productos

1. **ApoyoAI** (B2C, lanzamiento rápido) — Tutor IA por WhatsApp + app para alumnos. Pagado por padres. USD 6-20/mes/familia.
2. **EducAI** (B2B/B2G, lanzamiento institucional) — Plataforma integral colegios/ministerios. USD 2-5/alumno/mes o USD 50k-2M/año licencia.

**Estrategia:** ApoyoAI financia EducAI. Los datos de ApoyoAI alimentan el motor pedagógico de EducAI.

## Stack

- **Frontend web/gov:** Next.js 14+ App Router + TS + Tailwind + shadcn/ui (+ Tremor para dashboards)
- **Mobile:** Expo + React Native + TS + NativeWind
- **Backend:** NestJS + Prisma + PostgreSQL (Supabase) + BullMQ + Redis
- **IA:** Claude API (Anthropic) como principal, OpenAI secundario, pgvector para RAG, Whisper para audio, Claude Vision para OCR
- **Mensajería:** Twilio (WhatsApp)
- **Pagos:** MercadoPago (LATAM) + Stripe (internacional)
- **Infra:** Vercel (web), Render/Railway (api), EAS (mobile), Sentry + PostHog
- **Monorepo:** Turborepo + pnpm
- **CI/CD:** GitHub Actions

## Estructura

```
educai/
├── apps/
│   ├── web/             # Next.js — portal colegios + padres
│   ├── mobile/          # Expo RN — alumnos + padres
│   ├── gov-dashboard/   # Next.js + Tremor — ministerios
│   ├── api/             # NestJS — API principal
│   ├── whatsapp-agent/  # NestJS — agente tutor por Twilio
│   └── worker/          # BullMQ — jobs asíncronos
├── packages/
│   ├── database/        # Prisma schema + migrations + seed
│   ├── ui/              # shadcn compartido
│   ├── ai/              # Claude/OpenAI wrappers + prompts
│   ├── types/           # tipos TS compartidos
│   ├── config/          # eslint, tsconfig, prettier
│   └── i18n/            # traducciones (es-AR, es-419, pt-BR, en-US, qu, gn)
├── docs/
│   ├── architecture/    # ADRs
│   ├── api/             # OpenAPI
│   ├── pedagogy/        # validación pedagógica + prompts curados
│   └── claude/          # prompts de fases para Claude Code
└── turbo.json
```

## Principios no negociables

1. **Seguridad de menores**: Ley 26.061 (AR), LGPD (BR), COPPA. Consentimiento parental explícito, RLS estricto en Supabase, encriptación en reposo+tránsito, auditoría de accesos.
2. **Seguridad pedagógica del tutor IA**: nunca da la respuesta directa (método socrático). Filtros de contenido. Derivación a humano ante señales de crisis (bullying, abuso, salud mental).
3. **Multi-tenant desde día 1**: colegios aislados por `schoolId`, familias por `familyId`, RLS activo.
4. **Production-ready siempre**: typed, manejo de errores, logging estructurado (pino), observabilidad (Sentry + PostHog).
5. **Testeable**: ≥70% cobertura en lógica de negocio. Vitest unit + Playwright e2e + Supertest.
6. **Accesibilidad WCAG 2.1 AA**: no opcional.
7. **I18n-ready**: todo texto extraído desde el inicio.
8. **Offline-first mobile**: cache local + sync al reconectar + fallback SMS.
9. **Ético**: revisión de sesgos en cada modelo IA, transparencia de uso de datos.
10. **Escalable**: diseñado para 1M usuarios desde la arquitectura inicial.

## Roadmap

- **Fase 0** — Setup monorepo (2-3 días) — `docs/claude/01-FASE-0-SETUP.md`
- **Fase 1** — MVP ApoyoAI tutor IA WhatsApp (10-12 semanas) — `docs/claude/02-FASE-1-APOYOAI.md`
- **Fase 2** — MVP EducAI institucional (10-12 semanas paralelo) — `docs/claude/03-FASE-2-EDUCAI.md`
- **Fase 3** — Expansión módulos transversales — `docs/claude/04-FASE-3-EXPANSION.md`
- **Fase 4** — B2G + expansión regional — `docs/claude/05-FASE-4-B2G-EXPANSION.md`

## Reglas de desarrollo

- Español AR en copy visible al usuario. Nombres de código (variables, funciones, archivos) en inglés.
- Comentarios en español sólo donde aporten (el "porqué", no el "qué").
- Código modular: cada módulo debe poder desactivarse sin romper el sistema.
- Commits convencionales (feat, fix, chore, docs, refactor, test).
- Una fase por sesión de Claude Code para no quemar contexto.
- Validación pedagógica con pedagogos humanos antes de cualquier launch.
- **BienestAR (salud mental) requiere revisión de 2 profesionales de salud mental antes del release público**.

## Referencia rápida a docs

- Visión completa, módulos, KPIs, monetización → `docs/claude/00-PROYECTO-MAESTRO.md`
- Arquitectura del tutor IA y modelos de datos ApoyoAI → `docs/claude/02-FASE-1-APOYOAI.md`
- Modelos de datos EducAI institucional → `docs/claude/03-FASE-2-EDUCAI.md`
- Guía de uso del paquete de prompts → `docs/claude/README-USO.md`
