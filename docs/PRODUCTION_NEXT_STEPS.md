# Production Next Steps

Estado real despues de dejar CI, build y deploy listos del lado repo.

## Lo que ya esta

- frontends `web` y `gov-dashboard` armados y buildables
- `api`, `worker` y `whatsapp-agent` compilan y testean
- workflow de deploy listo para hooks reales
- checklist de release y matriz de secrets documentadas

## Lo que no resuelven las secrets

- claims y tenant context definitivos en `web`
- claims y tenant context definitivos en `gov-dashboard`
- usuarios reales con metadata correcta en Supabase Auth
- derivacion de `tenantId` desde token en vez de header manual
- apertura a usuarios reales sin riesgo de cruce multi-tenant

## Hallazgos concretos

- [`apps/web/src/app/login/page.tsx`](../apps/web/src/app/login/page.tsx) ya autentica con Supabase Auth, pero todavia no resuelve claims de rol o tenant
- [`apps/web/middleware.ts`](../apps/web/middleware.ts) ya protege sesion y rol base, pero depende de claims bien cargados en Supabase
- [`apps/gov-dashboard/src/app/login/page.tsx`](../apps/gov-dashboard/src/app/login/page.tsx) ya autentica con Supabase Auth, pero todavia no resuelve claims ministeriales ni segmentacion por jurisdiccion
- [`apps/gov-dashboard/middleware.ts`](../apps/gov-dashboard/middleware.ts) ya protege sesion y rol base, pero depende de claims ministeriales correctos
- [`apps/api/src/students/student.controller.ts`](../apps/api/src/students/student.controller.ts) ya usa sesion real y `req.user` para familias
- [`apps/api/src/auth/supabase-auth.service.ts`](../apps/api/src/auth/supabase-auth.service.ts) ya resuelve auth real y RBAC base para los tres modulos principales
- [`apps/api/src/curriculum/curriculum.controller.ts`](../apps/api/src/curriculum/curriculum.controller.ts) ya usa claims de tenant y school
- [`apps/api/src/lesson-plans/lesson-plan.controller.ts`](../apps/api/src/lesson-plans/lesson-plan.controller.ts) ya usa claims de tenant y teacher

## Orden recomendado

### 1. Secrets e infraestructura

- cargar variables segun [`docs/SECRETS_MATRIX.md`](./SECRETS_MATRIX.md)
- crear servicios reales en Vercel y Render
- validar deploy por hooks

### 2. Auth base

- completar claims y segmentacion real por rol sobre la sesion ya integrada
- endurecer middleware y UX ante sesion expirada

### 3. Claims y tenant context

- definir claims minimos: `userId`, `tenantId`, `tenantType`, `role`
- propagar claims al backend
- endurecer y documentar los claims requeridos por cada rol
- reemplazar cualquier header provisorio restante por identidad derivada de sesion o token

### 4. RBAC

- validar el mapeo actual de roles por superficie con usuarios reales
- agregar casos de excepcion si necesitás que un rol cruce de superficie

### 5. Validacion final con Supabase compartido

- probar un tenant EducAI aislado
- validar que no haya cruce con recursos de IncluAI
- revisar seeds, storage, auth y service-role usage

## Criterio de “listo para abrir”

No alcanza con deployar.

Recién puede considerarse listo para usuarios reales cuando:

- login real funciona
- rutas privadas estan protegidas
- tenant y rol salen de sesion/token
- endpoints sensibles ya no dependen de headers o bodies provisorios
- se valida aislamiento dentro del Supabase compartido
