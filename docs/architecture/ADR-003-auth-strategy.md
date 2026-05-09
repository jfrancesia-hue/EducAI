# ADR-003 — Estrategia de autenticacion: piloto local + migracion a Supabase Auth

- **Status:** Aceptado (provisorio para piloto)
- **Fecha:** 2026-05-07
- **Fase:** 0 / 1 (transicion a piloto cerrado)

## Contexto

`apps/api/src/auth` valida JWT HS256 con un `JWT_SECRET` propio. La cadena de confianza
actual es:

1. Web/Mobile/Gov llaman a `/auth/login` (todavia no existe end-to-end real).
2. Algun mecanismo provisorio (login local de fundador en Web) emite un JWT firmado
   por la API con HS256.
3. `JwtAuthGuard` valida el JWT y construye `AuthenticatedUser`.
4. `PrismaService.withUser(...)` setea `request.jwt.claims` para que las RLS policies
   apliquen el `tenantId` del usuario.

Esto **no usa Supabase Auth**. No hay `auth.users` lincado a `User`, no se valida
JWKS de Supabase, no hay signup/login multirol real, no hay reset de password ni MFA.
El JWT actual sirve solo como adapter para que las funciones SQL `current_tenant_id()`
y `is_service_role()` reciban claims con la forma esperada.

Para un piloto cerrado controlado (familias internas + un colegio amigo) esto puede
ser aceptable si se documenta como **temporal**. Para produccion publica no lo es.

## Decision

Adoptamos un **plan en dos fases**:

### Fase A — Piloto cerrado (ahora)

- Mantenemos el JWT HS256 propio como **adapter** entre la sesion del usuario y las
  policies RLS.
- Lo declaramos explicitamente como mecanismo de piloto en `docs/PRODUCTION-READINESS.md`
  y este ADR (waiver).
- Restricciones de seguridad mientras dura este modo:
  - Solo se aceptan signups invitados (no signup publico).
  - `JWT_SECRET` rotado por entorno y nunca commiteado.
  - `JwtAuthGuard` rechaza tokens con `exp` mayor a 24 h.
  - Cualquier acceso a datos de menores escribe `AuditLog` (P0 pendiente).

### Fase B — Supabase Auth (antes de produccion publica)

- Frontend (Web/Mobile/Gov) usa `@supabase/supabase-js` para login/signup.
- Supabase emite el JWT firmado con la clave del proyecto (HS256 o JWKS, segun
  configuracion).
- `JwtAuthGuard` se cambia a validar contra Supabase:
  - Si el proyecto sigue HS256: rotar `JWT_SECRET` para que matchee el secret de
    Supabase y reusar el guard actual.
  - Si se migra a JWKS asimetrico (recomendado para SSO): validar contra JWKS de
    `https://<project>.supabase.co/auth/v1/keys`.
- Cada `auth.users.id` (UUID) se linkea a `User.id` (Prisma) via `User.authUserId`
  (campo nuevo, opcional al principio, obligatorio en GA).
- Trigger en `auth.users` o webhook de `auth.user.created` crea automaticamente
  el `User` en Prisma con el `tenantId` resuelto al momento (segun invitacion).
- `request.jwt.claims` ya viene seteado por Supabase en cada request via
  `auth.jwt()`; las policies pueden seguir leyendo `tenant_id` si lo agregamos
  como custom claim en una hook function de Supabase.

### Custom claims en Supabase

Para que `current_tenant_id()` y similares sigan funcionando, se necesita un
**Auth Hook** (`access_token` hook en Supabase):

```sql
create or replace function public.educai_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  user_record record;
  custom_claims jsonb;
begin
  select u.id, u."tenantId", u.role, u."familyId", u."schoolId", u."teacherId"
    into user_record
    from public."User" u
   where u."authUserId" = (event ->> 'user_id')::uuid;

  custom_claims := jsonb_build_object(
    'tenant_id', user_record."tenantId",
    'family_id', user_record."familyId",
    'school_id', user_record."schoolId",
    'teacher_id', user_record."teacherId"
  );

  return jsonb_set(event, '{claims}', (event -> 'claims') || custom_claims);
end;
$$;
```

Activar con `Project Settings > Authentication > Hooks > Customize Access Token`.

## Alternativas consideradas

- **Auth0 / Clerk:** mas features (MFA, social login) pero costo extra y dependencia
  fuera de Supabase. Descartado por costo y por mover datos de menores fuera del DPA
  acordado.
- **Magic links propios:** requiere construir email infra desde cero y no resuelve el
  link `auth.users.id ↔ User.id`. Descartado.
- **NextAuth.js:** acopla autenticacion al frontend y complica la sesion en mobile +
  whatsapp-agent. Descartado.

## Consecuencias

### Positivas

- Piloto puede arrancar ya sin esperar la migracion completa.
- El work hacia Supabase Auth es incremental: solo cambia el origen del JWT, las
  policies y el shape de claims se mantienen.
- Una sola fuente de verdad de identidad (Supabase) en GA, con MFA y reset
  de password gratuitos.

### Negativas

- Doble path de auth durante la transicion (HS256 propio vs Supabase). Riesgo de
  confusion en code review.
- `JWT_SECRET` debe seguir siendo tratado como super-secret hasta GA.
- El custom claims hook agrega un round-trip extra al login (consulta a `User`
  durante token mint).

## Criterio de salida del waiver

Para considerar que la Fase A cumplio su rol y se puede pasar a produccion:

- [ ] `auth.users.id ↔ User.id` linkeado con migracion de datos.
- [ ] Frontend Web migrado a `@supabase/supabase-js`.
- [ ] Mobile y Gov migrados a Supabase Auth.
- [ ] Hook de custom claims activo y testeado en RLS smoke.
- [ ] `JwtAuthGuard` validando contra Supabase (HS256 o JWKS).
- [ ] Documentado el rollback path por si hay incidente.

## Referencias

- Supabase Auth Hooks: https://supabase.com/docs/guides/auth/auth-hooks
- Custom Access Token Hook: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
- ADR-002 (multi-tenant): `docs/architecture/ADR-002-multi-tenant-by-tenant-id.md`
