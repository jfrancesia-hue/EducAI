# Auth Readiness

Estado actual del frente de autenticacion, roles y contexto de tenant antes de abrir usuarios reales.

## Estado hoy

- `apps/web` todavia expone un acceso demo en `/login`
- no hay proveedor de identidad real conectado en web
- no hay sesion de usuario ni middleware de proteccion de rutas
- no hay RBAC efectivo conectado a pantallas o endpoints
- varios endpoints backend siguen recibiendo `tenantId`, `schoolId` o `familyId` desde request

## Hallazgos concretos

- [`apps/web/src/app/login/page.tsx`](../apps/web/src/app/login/page.tsx) declara explicitamente que el ingreso no valida credenciales
- [`apps/api/src/students/guards/family-scope.guard.ts`](../apps/api/src/students/guards/family-scope.guard.ts) usa `x-family-id` como mecanismo transitorio
- [`apps/api/src/students/student.controller.ts`](../apps/api/src/students/student.controller.ts) documenta ese header como provisorio hasta JWT real
- [`apps/api/src/curriculum/curriculum.controller.ts`](../apps/api/src/curriculum/curriculum.controller.ts) recibe `tenantId` y `schoolId` por body
- [`apps/api/src/lesson-plans/lesson-plan.controller.ts`](../apps/api/src/lesson-plans/lesson-plan.controller.ts) recibe `tenantId` por body

## Implicancia

El repo ya esta en condiciones de compilar, testear y desplegar servicios, pero todavia no esta listo
para exponer acceso real a usuarios institucionales o familias sin cerrar identidad, sesion y contexto
de tenant en servidor.

## Minimo para un primer deploy real

- conectar auth real en web y gov-dashboard
- emitir JWT con claims suficientes para tenant y rol
- reemplazar `x-family-id` por `req.user`
- dejar de aceptar `tenantId` sensible desde body cuando deba derivarse de la sesion
- proteger rutas UI y endpoints backend por autenticacion y rol
- validar que el tenant derivado del token no pueda cruzarse con recursos de IncluAI
