# EducAI LATAM — Documento Maestro del Proyecto

> **Propósito de este documento:** Servir como contexto raíz para Claude Code. Pegalo en el `CLAUDE.md` del repo o usalo como referencia en cada sesión.

---

## 1. Visión del Producto

**EducAI LATAM** es el sistema operativo de la educación moderna para países en desarrollo. Una plataforma SaaS que conecta **alumnos, padres, docentes, colegios y gobiernos** bajo un mismo ecosistema, con IA pedagógica, evaluación por competencias, analítica predictiva y foco en impacto social real.

**Tagline:** *"El sistema operativo de la escuela moderna."*

**Empresa:** Nativos Consultora Digital
**Mercado primario:** Argentina (NOA) → LATAM → países emergentes
**Modelo:** B2C (padres) + B2B (colegios privados) + B2B2C (colegios) + B2G (gobiernos) + fondos de impacto

---

## 2. Problema que Resuelve

En LATAM y países en desarrollo:

1. Currículos desactualizados (20-30 años de atraso en competencias modernas).
2. Docentes sin formación continua efectiva.
3. Padres desconectados del proceso pedagógico, pagando clases particulares caras.
4. Evaluación memorística, no por competencias.
5. Cero personalización del aprendizaje.
6. Directivos y ministerios sin datos reales para decidir.
7. Deserción escolar del 30-40% sin detección temprana.
8. Salud mental adolescente ignorada.
9. Brecha digital y de conectividad.
10. Educación desconectada de vida real (finanzas, IA, empleabilidad).

---

## 3. Productos del Ecosistema

El ecosistema se compone de **dos productos principales** que se pueden lanzar por separado o integrados:

### 3.1 ApoyoAI (B2C — lanzamiento rápido)
Tutor IA por WhatsApp y app para alumnos, pagado por los padres.
**Objetivo:** reemplazar o complementar profesores particulares.
**Ticket:** USD 6-20/mes por familia.

### 3.2 EducAI (B2B / B2G — lanzamiento institucional)
Plataforma integral para colegios y ministerios.
**Objetivo:** modernizar currículos, formar docentes, detectar deserción, analizar desempeño.
**Ticket:** USD 2-5 por alumno/mes (colegios) o USD 50k-2M anual (ministerios).

**Estrategia:** ApoyoAI financia EducAI. Los datos de ApoyoAI alimentan el motor pedagógico de EducAI.

---

## 4. Módulos del Ecosistema

| # | Módulo | Producto | Fase | Prioridad |
|---|--------|----------|------|-----------|
| 1 | Tutor IA conversacional (WhatsApp + app) | ApoyoAI | 1 | Alta |
| 2 | Diagnóstico y currículo IA | EducAI | 1 | Alta |
| 3 | Formación docente continua (DocenteAI) | EducAI | 1 | Alta |
| 4 | Portfolio digital del alumno | EducAI | 2 | Alta |
| 5 | Bienestar socioemocional (BienestAR) | EducAI + ApoyoAI | 2 | Alta |
| 6 | Escuela de padres | ApoyoAI + EducAI | 2 | Media |
| 7 | Vida Real (finanzas, IA, ciudadanía digital) | ApoyoAI | 2 | Media |
| 8 | Detección temprana de deserción | EducAI (B2G) | 3 | Alta |
| 9 | Empleabilidad y futuro laboral | EducAI | 3 | Media |
| 10 | Multilingüe cultural (quechua, guaraní, etc.) | EducAI | 4 | Media |
| 11 | Salud escolar integrada | EducAI | 4 | Media |
| 12 | Integridad académica con IA | EducAI | 3 | Media |
| 13 | Modo offline y por SMS | EducAI + ApoyoAI | 3 | Alta |
| 14 | Observatorio educativo (datos abiertos) | EducAI (B2G) | 4 | Baja |
| 15 | Marketplace de profes humanos | ApoyoAI | 3 | Media |
| 16 | Gamificación y hábito | ApoyoAI | 2 | Alta |

---

## 5. Stack Tecnológico

### Frontend
- **Web (colegios + padres):** Next.js 14+ con App Router + TypeScript + TailwindCSS + shadcn/ui
- **Mobile (alumnos + padres):** React Native con Expo + TypeScript
- **Dashboards ministeriales:** Next.js + Recharts/Tremor

### Backend
- **API principal:** NestJS con TypeScript
- **ORM:** Prisma
- **Base de datos:** PostgreSQL (Supabase para infra gestionada)
- **Auth:** Supabase Auth + JWT
- **Storage:** Supabase Storage (evidencias, portfolios)
- **Colas:** BullMQ + Redis (procesamiento de reportes, análisis IA)

### IA y Mensajería
- **LLM principal:** Claude API (Anthropic) — razonamiento pedagógico, tutoría socrática
- **LLM secundario:** OpenAI — generación de ejercicios, embeddings
- **WhatsApp:** Twilio (canal principal de ApoyoAI)
- **Vector DB:** pgvector en Supabase o Pinecone (biblioteca de contenidos, RAG curricular)
- **OCR:** Google Cloud Vision o Claude Vision (fotos de ejercicios)
- **Voz:** Whisper (audio → texto del alumno)

### Pagos
- **LATAM:** Mercado Pago
- **Internacional:** Stripe

### Infraestructura
- **Deploy web:** Vercel
- **Deploy backend:** Render / Railway / Fly.io
- **Mobile distribución:** EAS (Expo) + App Store + Play Store
- **Monitoreo:** Sentry + PostHog (analytics de producto)

### DevOps
- **Monorepo:** Turborepo
- **CI/CD:** GitHub Actions
- **Testing:** Vitest (unit) + Playwright (e2e)

---

## 6. Arquitectura de Alto Nivel

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                                │
├──────────────┬─────────────┬─────────────┬──────────────────────┤
│ Next.js Web  │ React Native│ WhatsApp    │ Dashboard Ministerial│
│ (Colegios +  │ (Alumnos +  │ (Twilio -   │ (Next.js + Tremor)   │
│ Padres)      │ Padres)     │ ApoyoAI)    │                      │
└──────┬───────┴──────┬──────┴──────┬──────┴──────────┬───────────┘
       │              │             │                 │
       └──────────────┴─────────────┴─────────────────┘
                            │
                            ▼
                ┌───────────────────────────┐
                │    API GATEWAY (NestJS)   │
                │    Auth + Rate Limit      │
                └───────────┬───────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
┌──────────────┐   ┌────────────────┐   ┌────────────────┐
│ MÓDULO CORE  │   │ MÓDULO IA      │   │ MÓDULO ANALYTICS│
│ - Users      │   │ - Tutor Agent  │   │ - Dashboards   │
│ - Schools    │   │ - Curriculum AI│   │ - Deserción AI │
│ - Curriculum │   │ - Doc Planner  │   │ - Reportes     │
│ - Portfolio  │   │ - Emotional    │   │ - B2G Exports  │
└──────┬───────┘   └────────┬───────┘   └────────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ▼
              ┌─────────────────────────────┐
              │   DATA LAYER (Supabase)     │
              │ - PostgreSQL + pgvector     │
              │ - Storage (evidencias)      │
              │ - Auth + RLS                │
              └─────────────────────────────┘

              ┌─────────────────────────────┐
              │   EXTERNAL SERVICES         │
              │ - Claude API  - OpenAI      │
              │ - Twilio      - MercadoPago │
              │ - Stripe      - Whisper     │
              └─────────────────────────────┘
```

---

## 7. Roadmap de Fases

### Fase 0 — Fundación (2 semanas)
Setup del monorepo, infraestructura, landing de validación, entrevistas con 10 directivos y 20 docentes.

### Fase 1 — MVP ApoyoAI (3 meses)
Tutor IA por WhatsApp, diagnóstico de alumno, reportes a padres, pagos.
**Meta:** 100 familias pagando.

### Fase 2 — MVP EducAI (3 meses, paralelo)
Diagnóstico curricular institucional, generador de planificaciones, DocenteAI.
**Meta:** 3-5 colegios piloto.

### Fase 3 — Expansión ApoyoAI (2 meses)
Gamificación, portfolio básico, escuela de padres, Vida Real.
**Meta:** 1.000 familias pagando, NPS > 60.

### Fase 4 — Integración y B2G (4 meses)
Detección de deserción, dashboard ministerial, integridad académica, marketplace profes humanos.
**Meta:** primera licencia provincial firmada.

### Fase 5 — Escalado regional (6 meses)
Multilingüe, offline, salud escolar, observatorio de datos, expansión NOA y Bolivia.

---

## 8. Consideraciones Críticas

### Seguridad y privacidad de menores
- Cumplimiento Ley 26.061 (Argentina), LGPD (Brasil), COPPA (si se expande a EEUU).
- Consentimiento parental explícito para menores de 13 años.
- Row Level Security (RLS) estricto en Supabase.
- Encriptación en reposo y en tránsito.
- Logs de auditoría de todo acceso a datos de menores.
- DPO (Data Protection Officer) identificado.

### Seguridad pedagógica del agente IA
- El Tutor IA **nunca da la respuesta directa**, guía socráticamente.
- Filtros de contenido inapropiado (lenguaje, temas sensibles).
- Derivación automática a humanos ante señales de crisis emocional, bullying, abuso.
- Validación pedagógica de cada prompt por un consejo académico.

### Accesibilidad
- WCAG 2.1 AA mínimo.
- Soporte total para lectores de pantalla.
- Modo alto contraste y tamaño de fuente variable.

### Offline-first en mobile
- Cache local de contenidos.
- Sincronización al reconectar.
- Versión SMS para zonas sin datos.

---

## 9. KPIs del Proyecto

### ApoyoAI (B2C)
- MAU (Monthly Active Users) de alumnos
- Retención mensual (objetivo > 70%)
- Tiempo de uso diario promedio (objetivo > 20 min)
- Conversión free → paid (objetivo > 8%)
- Churn mensual (objetivo < 5%)
- NPS de padres y alumnos

### EducAI (B2B/B2G)
- Colegios activos
- Docentes formados
- Planificaciones generadas por mes
- Reducción de tiempo de planificación docente (objetivo 60%)
- Reducción de deserción en colegios piloto (objetivo 15-25%)
- Licencias ministeriales firmadas

---

## 10. Modelo de Monetización Consolidado

| Segmento | Producto | Modelo | Ticket |
|----------|----------|--------|--------|
| Padres (básico) | ApoyoAI | Suscripción | USD 6/mes |
| Padres (premium) | ApoyoAI | Suscripción | USD 12/mes |
| Padres (familiar) | ApoyoAI | Suscripción | USD 20/mes |
| Colegios privados | EducAI | SaaS por alumno | USD 2-5/alumno/mes |
| Colegios públicos | EducAI | Licencia | USD 50k-500k/año |
| Ministerios | EducAI Gov | Licencia + consultoría | USD 200k-2M/año |
| ONGs/Fundaciones | Ambos | Licencias subsidiadas | Negociable |
| Marketplace profes | ApoyoAI | Comisión 20-30% | Variable |
| Sponsorships educación financiera | ApoyoAI | Contenido patrocinado | USD 10-50k/campaña |

---

## 11. Principios de Desarrollo

1. **Production-ready siempre.** No prototipos, no demos. Código que pueda ir a producción.
2. **Modular.** Cada módulo debe poder desactivarse sin romper el sistema.
3. **Multi-tenant desde el día 1.** Colegios aislados por `school_id`, familias por `family_id`.
4. **Observable.** Logs estructurados, métricas, trazas distribuidas.
5. **Testeable.** Cobertura mínima 70% en lógica de negocio.
6. **Documentado.** READMEs por módulo, ADRs para decisiones clave.
7. **I18n-ready.** Todo texto extraído a archivos de traducción desde el inicio.
8. **Accesible.** WCAG 2.1 AA no es opcional.
9. **Ético.** Revisión de sesgos en cada modelo IA, transparencia en uso de datos.
10. **Escalable.** Diseñado para 1M de usuarios desde la arquitectura inicial.

---

## 12. Estructura de Repositorios (Monorepo Turborepo)

```
educai/
├── apps/
│   ├── web/                # Next.js - Portal colegios + padres
│   ├── mobile/             # React Native - Alumnos + padres
│   ├── gov-dashboard/      # Next.js - Dashboard ministerial
│   ├── api/                # NestJS - API principal
│   ├── whatsapp-agent/     # NestJS - Agente Mica educativo (ApoyoAI)
│   └── worker/             # BullMQ workers - procesamiento asíncrono
├── packages/
│   ├── database/           # Prisma schema + migrations
│   ├── ui/                 # Componentes compartidos (shadcn)
│   ├── ai/                 # Wrappers Claude + OpenAI + prompts
│   ├── types/              # Tipos compartidos TypeScript
│   ├── config/             # Configuración compartida (eslint, tsconfig)
│   └── i18n/               # Archivos de traducción
├── docs/
│   ├── architecture/       # ADRs
│   ├── api/                # OpenAPI specs
│   └── pedagogy/           # Validación pedagógica, prompts curados
└── turbo.json
```

---

## 13. Próximos Pasos Sugeridos

1. Leer el archivo `01-FASE-0-SETUP.md` para el setup inicial del monorepo.
2. Leer `02-FASE-1-APOYOAI.md` para empezar el MVP de tutor IA.
3. Los archivos siguientes (`03`, `04`...) cubren las fases posteriores y módulos específicos.
4. Cada archivo contiene prompts listos para pegar en Claude Code.
