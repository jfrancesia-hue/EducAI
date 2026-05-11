# Auth Readiness

Estado actual del frente de autenticacion, roles y contexto de tenant antes de abrir usuarios reales.

## Estado hoy

- `apps/web` todavia expone un acceso demo en `/login`
- no hay proveedor de identidad real conectado en web
- la web usa una sesion demo local con cookie y middleware, no identidad real
- no hay RBAC efectivo conectado a pantallas o endpoints
- varios endpoints backend siguen usando headers provisorios para identidad y contexto de tenant

## Hallazgos concretos

- [`apps/web/src/app/login/page.tsx`](../apps/web/src/app/login/page.tsx) declara explicitamente que el ingreso no valida credenciales
- [`apps/api/src/students/guards/family-scope.guard.ts`](../apps/api/src/students/guards/family-scope.guard.ts) usa `x-family-id` como mecanismo transitorio
- [`apps/api/src/students/student.controller.ts`](../apps/api/src/students/student.controller.ts) usa `x-family-id` y `x-tenant-id` como reemplazo temporal de JWT real
- [`apps/api/src/curriculum/curriculum.controller.ts`](../apps/api/src/curriculum/curriculum.controller.ts) usa `x-tenant-id` y `x-school-id` como contexto institucional transitorio
- [`apps/api/src/lesson-plans/lesson-plan.controller.ts`](../apps/api/src/lesson-plans/lesson-plan.controller.ts) usa `x-tenant-id` y `x-teacher-id` como contexto docente transitorio

## Implicancia

El repo ya esta en condiciones de compilar, testear y desplegar servicios, pero todavia no esta listo
para exponer acceso real a usuarios institucionales o familias sin cerrar identidad, sesion y contexto
de tenant en servidor.

## Minimo para un primer deploy real

- conectar auth real en web y gov-dashboard
- emitir JWT con claims suficientes para tenant y rol
- reemplazar `x-family-id` por `req.user`
- reemplazar headers provisorios por `req.user` o contexto derivado del token
- proteger rutas UI y endpoints backend por autenticacion y rol
- validar que el tenant derivado del token no pueda cruzarse con recursos de IncluAI
