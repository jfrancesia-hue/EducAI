# Supabase Setup

Proyecto Supabase elegido:

```txt
https://mfjpoaipjlimzdxkusav.supabase.co
```

**Proyecto compartido con IncluIA**. EducAI vive en el schema dedicado
`educai` desde 2026-05-08; IncluIA mantiene sus 7 tablas snake_case en
`public`. Los buckets de Storage usan prefijo `educai-` (`educai-evidencias`,
`educai-portfolios`, `educai-avatares`) — los nombres sin prefijo quedan
reservados para IncluIA u otros consumidores.

## Variables por app

Copiar cada `.env.example` a `.env.local` o `.env` segun la app que vayas a correr. Los archivos reales de entorno estan ignorados por git.

### API

Archivo local: `apps/api/.env`

```env
DATABASE_URL=<copiar desde Supabase Dashboard > Project Settings > Database>
DATABASE_URL_APP=<rol educai_app sin BYPASSRLS para runtime y smoke tests>
SUPABASE_URL=https://mfjpoaipjlimzdxkusav.supabase.co
SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service role key, solo backend>
```

`SUPABASE_SERVICE_ROLE_KEY` nunca va en Web, Mobile, Gov Dashboard ni variables `NEXT_PUBLIC_*`/`EXPO_PUBLIC_*`.
`DATABASE_URL` con `postgres` queda reservado para migraciones. Runtime y smoke tests deben usar `DATABASE_URL_APP` con un rol sin `BYPASSRLS`.

### Web

Archivo local: `apps/web/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://mfjpoaipjlimzdxkusav.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

### Mobile

Archivo local: `apps/mobile/.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://mfjpoaipjlimzdxkusav.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

### Gov Dashboard

Archivo local: `apps/gov-dashboard/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://mfjpoaipjlimzdxkusav.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

## Base de datos

### Setup automatico (recomendado)

```bash
# Linux/macOS/Git Bash
DATABASE_URL='postgresql://...' ./scripts/db-setup.sh

# Windows PowerShell
$env:DATABASE_URL = 'postgresql://...'
.\scripts\db-setup.ps1
```

El script aplica migraciones Prisma, ejecuta `supabase/migrations/*.sql` (RLS +
storage policies), siembra datos y corre el smoke test RLS. Requiere `psql` en
PATH; si no esta, salta el paso de SQL Editor y te lista los archivos a copiar.

### Setup manual

1. En Supabase, abrir `Project Settings > Database`.
2. Copiar el connection string para Node/Prisma. Reemplazar el password real en
   `DATABASE_URL`.
3. Aplicar Prisma:

   ```bash
   pnpm db:deploy
   ```

4. Aplicar las migraciones de Supabase (RLS + storage policies). Pegarlas en
   Supabase Dashboard > SQL Editor en orden alfabetico:
   - `supabase/migrations/001_initial_rls.sql`
   - `supabase/migrations/002_storage_policies.sql`

5. Sembrar datos:

   ```bash
   pnpm db:seed
   ```

6. Correr el smoke test RLS:

   ```bash
   pnpm --filter @educai/database test:rls
   ```

## Smoke test RLS

`packages/database/test/rls-smoke.spec.ts` valida con dos tenants reales del seed
(`familia-nativos-consultora` y `familia-garcia-salta`) que:

- Cada tenant solo ve sus propios `Student` y `Subscription`.
- Tenant A no puede leer rows de tenant B aun pidiendolas por id.
- `service_role` claim bypasea RLS y ve todo.
- Sin claims (rol anonimo) no se ven students.
- WITH CHECK rechaza inserts con `tenantId` ajeno al claim.

El test se skipea si no hay `DATABASE_URL` (o `DATABASE_URL_APP`) seteada. CI corre
con un rol `educai_app` NOBYPASSRLS para evitar falsos verdes por superuser.

## Checklist antes de usar datos reales

- [ ] `DATABASE_URL` apunta al proyecto `mfjpoaipjlimzdxkusav`.
- [ ] `DATABASE_URL_APP` apunta al rol `educai_app` sin `BYPASSRLS`.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` existe solo en backend/CI.
- [ ] Migraciones Prisma aplicadas (`pnpm db:deploy`).
- [ ] `001_initial_rls.sql` y `002_storage_policies.sql` aplicadas.
- [ ] Smoke test RLS pasa contra dos tenants.
- [ ] Storage buckets `educai-evidencias`, `educai-portfolios` y
      `educai-avatares` con policies verificadas en Supabase Dashboard >
      Storage. (Aplicar `002_storage_policies.sql` desde SQL Editor del
      Dashboard porque la conexion `postgres` no es owner de
      `storage.objects`.)
- [ ] Auth definido (ver `docs/architecture/ADR-003-auth-strategy.md`).
- [ ] La API en produccion conecta con un rol NOBYPASSRLS (no `postgres` superuser).
