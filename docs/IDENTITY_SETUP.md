# Identity Setup

Guia operativa para poblar usuarios reales en Supabase Auth con los claims que el repo ya espera.

## Dónde sacar la key correcta

En Supabase actual, la key elevada que necesitás suele aparecer como:

- `Secret key` con formato `sb_secret_...`

Tambien puede existir la key legacy:

- `service_role`

Para este repo, cualquiera de estas dos sirve:

- `SUPABASE_SECRET_KEY` recomendado
- `SUPABASE_SERVICE_ROLE_KEY` como fallback legacy

No sirve:

- `Publishable key` con formato `sb_publishable_...`

## Rol y claims acordados

### `PARENT`

- acceso a `apps/api` para `students`
- claims obligatorios:
  - `role=PARENT`
  - `tenantId`
  - `familyId`

### `TEACHER`

- acceso a `apps/web /app/*`
- acceso a `apps/api` para `lesson-plans`
- claims obligatorios:
  - `role=TEACHER`
  - `tenantId`
  - `teacherId`

### `SCHOOL_ADMIN`

- acceso a `apps/web /app/*`
- acceso a `apps/api` para `curriculum` y `lesson-plans`
- claims obligatorios:
  - `role=SCHOOL_ADMIN`
  - `tenantId`
  - `schoolId`

### `MINISTRY`

- acceso a `apps/gov-dashboard /`
- acceso a `apps/api` para `curriculum`
- claims obligatorios:
  - `role=MINISTRY`
  - `tenantId`

### `SUPER_ADMIN`

- acceso transversal a las superficies actuales
- claims obligatorios:
  - `role=SUPER_ADMIN`
  - `tenantId`

## Recomendación operativa

1. Crear primero 4 usuarios de prueba:
   - 1 `SCHOOL_ADMIN`
   - 1 `TEACHER`
   - 1 `PARENT`
   - 1 `MINISTRY`
2. Confirmar que cada uno entra solo a su superficie correcta.
3. Recién después cargar usuarios reales.

## Usuario de prueba recomendado para vos

- `email`: `agustinaguirrefrancesia@gmail.com`
- `role`: `SCHOOL_ADMIN`
- `tenantId`: `tnt_school_1`
- `schoolId`: `sch_1`

## Qué falta para que yo lo cree desde acá

Solo una de estas dos:

- `SUPABASE_SECRET_KEY` recomendado
- `SUPABASE_SERVICE_ROLE_KEY` legacy

## Script para provisionar usuarios

Desde `apps/api`:

1. Copiar `scripts/auth-users.example.json`
2. Crear un JSON con tus usuarios reales o de prueba
3. Ejecutar `pnpm auth:sync-users <ruta-al-json>`

El script crea o actualiza usuarios en Supabase Auth y les deja cargados los claims en `app_metadata`.
