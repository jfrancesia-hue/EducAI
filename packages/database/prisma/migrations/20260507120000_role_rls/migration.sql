-- Add Row Level Security to Role table.
-- Role.tenantId is nullable: globally-scoped roles (NULL) coexist with per-tenant roles.
-- Reads: service_role bypasses; authenticated users see globals + their own tenant rows.
-- Writes: service_role only for globals; tenant scope for tenant-owned rows.

do $$
begin
  alter table if exists public."Role" enable row level security;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'Role'
      and policyname = 'tenant_or_global_read_Role'
  ) then
    create policy "tenant_or_global_read_Role" on public."Role"
      for select
      using (
        public.is_service_role()
        or "tenantId" is null
        or "tenantId"::text = public.current_tenant_id()
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'Role'
      and policyname = 'tenant_write_Role'
  ) then
    create policy "tenant_write_Role" on public."Role"
      for insert
      with check (
        public.is_service_role()
        or (
          "tenantId" is not null
          and "tenantId"::text = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'Role'
      and policyname = 'tenant_update_Role'
  ) then
    create policy "tenant_update_Role" on public."Role"
      for update
      using (
        public.is_service_role()
        or (
          "tenantId" is not null
          and "tenantId"::text = public.current_tenant_id()
        )
      )
      with check (
        public.is_service_role()
        or (
          "tenantId" is not null
          and "tenantId"::text = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'Role'
      and policyname = 'tenant_delete_Role'
  ) then
    create policy "tenant_delete_Role" on public."Role"
      for delete
      using (
        public.is_service_role()
        or (
          "tenantId" is not null
          and "tenantId"::text = public.current_tenant_id()
        )
      );
  end if;
end $$;
