# Auth Readiness

Estado actual del frente de autenticacion, roles y contexto de tenant antes de abrir usuarios reales.

## Estado hoy

- `apps/web` ya autentica contra Supabase Auth en `/login`
- `apps/gov-dashboard` ya autentica contra Supabase Auth en `/login`
- la web ya protege `/app/*` con sesion SSR, login real y logout real
- `gov-dashboard` ya protege `/` con sesion SSR, login real y logout real
- ya existe un RBAC base por rol en frontends y backend principal
- sigue faltando estandarizar claims por rol y poblar usuarios reales en Supabase Auth

## Hallazgos concretos

- [`apps/web/src/app/login/page.tsx`](../apps/web/src/app/login/page.tsx) ya exige credenciales reales de Supabase Auth
- [`apps/web/middleware.ts`](../apps/web/middleware.ts) protege `/app/*` y evita acceso sin sesion
- [`apps/gov-dashboard/src/app/login/page.tsx`](../apps/gov-dashboard/src/app/login/page.tsx) ya exige credenciales reales de Supabase Auth
- [`apps/gov-dashboard/middleware.ts`](../apps/gov-dashboard/middleware.ts) protege `/` y evita acceso sin sesion
- [`apps/api/src/students/student.controller.ts`](../apps/api/src/students/student.controller.ts) ya exige `Authorization: Bearer <token>`
- [`apps/api/src/auth/supabase-auth.service.ts`](../apps/api/src/auth/supabase-auth.service.ts) valida la sesion contra Supabase Auth y extrae claims desde metadata
- [`apps/api/src/curriculum/curriculum.controller.ts`](../apps/api/src/curriculum/curriculum.controller.ts) ya consume `tenantId` y `schoolId` desde claims
- [`apps/api/src/lesson-plans/lesson-plan.controller.ts`](../apps/api/src/lesson-plans/lesson-plan.controller.ts) ya consume `tenantId` y `teacherId` desde claims
- [`apps/api/src/auth/roles.guard.ts`](../apps/api/src/auth/roles.guard.ts) ya aplica restricciones base por rol en endpoints
- [`apps/web/middleware.ts`](../apps/web/middleware.ts) y [`apps/gov-dashboard/middleware.ts`](../apps/gov-dashboard/middleware.ts) ya redirigen a acceso denegado si el rol no corresponde

## Implicancia

El repo ya no depende de una cookie demo en web, pero todavia no esta listo para exponer acceso real
a usuarios institucionales o familias sin cerrar claims, RBAC y contexto de tenant en servidor.

## Minimo para un primer deploy real

- emitir JWT con claims suficientes para tenant y rol
- unificar el contrato de claims por rol (`PARENT`, `TEACHER`, `SCHOOL_ADMIN`, `MINISTRY`)
- remover cualquier header provisorio residual fuera del backend principal
- poblar usuarios reales con esos claims en Supabase Auth
- validar que el tenant derivado del token no pueda cruzarse con recursos de IncluAI
