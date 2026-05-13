# Auth Readiness

Estado actual del frente de autenticacion, roles y contexto de tenant antes de abrir usuarios reales.

## Estado hoy

- `apps/web` ya autentica contra Supabase Auth en `/login`
- la web ya protege `/app/*` con sesion SSR, login real y logout real
- no hay RBAC efectivo conectado a pantallas o endpoints
- varios endpoints backend siguen usando headers provisorios para identidad y contexto de tenant

## Hallazgos concretos

- [`apps/web/src/app/login/page.tsx`](../apps/web/src/app/login/page.tsx) ya exige credenciales reales de Supabase Auth
- [`apps/web/middleware.ts`](../apps/web/middleware.ts) protege `/app/*` y evita acceso sin sesion
- [`apps/api/src/students/student.controller.ts`](../apps/api/src/students/student.controller.ts) ya exige `Authorization: Bearer <token>`
- [`apps/api/src/auth/supabase-auth.service.ts`](../apps/api/src/auth/supabase-auth.service.ts) valida la sesion contra Supabase Auth y extrae claims desde metadata
- [`apps/api/src/curriculum/curriculum.controller.ts`](../apps/api/src/curriculum/curriculum.controller.ts) usa `x-tenant-id` y `x-school-id` como contexto institucional transitorio
- [`apps/api/src/lesson-plans/lesson-plan.controller.ts`](../apps/api/src/lesson-plans/lesson-plan.controller.ts) usa `x-tenant-id` y `x-teacher-id` como contexto docente transitorio

## Implicancia

El repo ya no depende de una cookie demo en web, pero todavia no esta listo para exponer acceso real
a usuarios institucionales o familias sin cerrar claims, RBAC y contexto de tenant en servidor.

## Minimo para un primer deploy real

- extender auth real a `gov-dashboard`
- emitir JWT con claims suficientes para tenant y rol
- extender el mismo patron de `req.user` a `curriculum` y `lesson-plans`
- reemplazar los headers provisorios restantes por `req.user` o contexto derivado del token
- proteger rutas UI y endpoints backend por autenticacion y rol
- validar que el tenant derivado del token no pueda cruzarse con recursos de IncluAI
