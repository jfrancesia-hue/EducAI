# Production Next Steps

Estado real despues de dejar CI, build y deploy listos del lado repo.

## Lo que ya esta

- frontends `web` y `gov-dashboard` armados y buildables
- `api`, `worker` y `whatsapp-agent` compilan y testean
- workflow de deploy listo para hooks reales
- checklist de release y matriz de secrets documentadas

## Lo que no resuelven las secrets

- claims y tenant context en `web`
- autenticacion real en `gov-dashboard`
- proteccion de rutas y sesiones
- RBAC por rol y tenant
- derivacion de `tenantId` desde token en vez de header manual
- apertura a usuarios reales sin riesgo de cruce multi-tenant

## Hallazgos concretos

- [`apps/web/src/app/login/page.tsx`](../apps/web/src/app/login/page.tsx) ya autentica con Supabase Auth, pero todavia no resuelve claims de rol o tenant
- [`apps/web/middleware.ts`](../apps/web/middleware.ts) protege sesion en UI, pero no alcanza para RBAC ni aislamiento de datos
- [`apps/api/src/students/student.controller.ts`](../apps/api/src/students/student.controller.ts) ya usa sesion real y `req.user` para familias
- [`apps/api/src/auth/supabase-auth.service.ts`](../apps/api/src/auth/supabase-auth.service.ts) ya resuelve auth real para los tres modulos principales, pero falta endurecer RBAC
- [`apps/api/src/curriculum/curriculum.controller.ts`](../apps/api/src/curriculum/curriculum.controller.ts) ya usa claims de tenant y school
- [`apps/api/src/lesson-plans/lesson-plan.controller.ts`](../apps/api/src/lesson-plans/lesson-plan.controller.ts) ya usa claims de tenant y teacher

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
- endurecer y documentar los claims requeridos por cada rol
- reemplazar cualquier header provisorio restante por identidad derivada de sesion o token

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
