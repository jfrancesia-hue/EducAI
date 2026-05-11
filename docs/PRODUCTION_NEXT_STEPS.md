# Production Next Steps

Estado real despues de dejar CI, build y deploy listos del lado repo.

## Lo que ya esta

- frontends `web` y `gov-dashboard` armados y buildables
- `api`, `worker` y `whatsapp-agent` compilan y testean
- workflow de deploy listo para hooks reales
- checklist de release y matriz de secrets documentadas

## Lo que no resuelven las secrets

- autenticacion real en `web`
- proteccion de rutas y sesiones
- RBAC por rol y tenant
- derivacion de `tenantId` desde token en vez de body o header manual
- apertura a usuarios reales sin riesgo de cruce multi-tenant

## Hallazgos concretos

- [`apps/web/src/app/login/page.tsx`](../apps/web/src/app/login/page.tsx) sigue siendo acceso demo
- [`apps/web/src/app/app/page.tsx`](../apps/web/src/app/app/page.tsx) y [`apps/web/src/app/app/_components/app-shell.tsx`](../apps/web/src/app/app/_components/app-shell.tsx) muestran claramente superficie demo
- [`apps/api/src/students/guards/family-scope.guard.ts`](../apps/api/src/students/guards/family-scope.guard.ts) usa `x-family-id`
- [`apps/api/src/students/student.controller.ts`](../apps/api/src/students/student.controller.ts) documenta ese header como transitorio
- [`apps/api/src/curriculum/curriculum.controller.ts`](../apps/api/src/curriculum/curriculum.controller.ts) recibe `tenantId` por body
- [`apps/api/src/lesson-plans/lesson-plan.controller.ts`](../apps/api/src/lesson-plans/lesson-plan.controller.ts) recibe `tenantId` por body

## Orden recomendado

### 1. Secrets e infraestructura

- cargar variables segun [`docs/SECRETS_MATRIX.md`](./SECRETS_MATRIX.md)
- crear servicios reales en Vercel y Render
- validar deploy por hooks

### 2. Auth base

- elegir proveedor real de auth para web y gov-dashboard
- login real con sesion
- middleware para rutas protegidas
- logout y manejo de sesion expirada

### 3. Claims y tenant context

- definir claims minimos: `userId`, `tenantId`, `tenantType`, `role`
- propagar claims al backend
- reemplazar `x-family-id` por identidad derivada del token
- dejar de aceptar `tenantId` sensible desde body cuando corresponda

### 4. RBAC

- proteger rutas UI por rol
- proteger endpoints backend por rol y tenant
- mapear `MINISTRY`, `SCHOOL_ADMIN`, `TEACHER`, `PARENT`

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
