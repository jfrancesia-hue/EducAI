-- Storage policies para los 3 buckets creados en 001_initial_rls.sql.
-- Convencion de paths: {tenantId}/{...} para evidencias, portfolios y avatares.
-- (storage.foldername(name))[1] = primer segmento del path = tenant_id propietario.

-- Habilitar RLS en storage.objects (Supabase ya lo trae habilitado, pero lo dejamos
-- explicito para que esta migracion sea idempotente contra Postgres locales tambien).
alter table if exists storage.objects enable row level security;

-- Helper local: extrae el tenant_id del path del objeto sin romper si el path esta vacio.
create or replace function storage.educai_object_tenant_id(object_name text)
returns text
language sql
stable
as $$
  select coalesce((storage.foldername(object_name))[1], '')
$$;

do $$
begin
  -- ============================================================
  -- evidencias (privado)
  -- Lectura: solo objetos cuyo primer segmento coincide con el tenant del JWT.
  -- Escritura/borrado: idem, ademas service_role siempre puede.
  -- ============================================================
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_read_evidencias'
  ) then
    create policy tenant_read_evidencias on storage.objects
      for select
      using (
        bucket_id = 'evidencias'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_write_evidencias'
  ) then
    create policy tenant_write_evidencias on storage.objects
      for insert
      with check (
        bucket_id = 'evidencias'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_update_evidencias'
  ) then
    create policy tenant_update_evidencias on storage.objects
      for update
      using (
        bucket_id = 'evidencias'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      )
      with check (
        bucket_id = 'evidencias'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_delete_evidencias'
  ) then
    create policy tenant_delete_evidencias on storage.objects
      for delete
      using (
        bucket_id = 'evidencias'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  -- ============================================================
  -- portfolios (privado, mismo patron que evidencias)
  -- ============================================================
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_read_portfolios'
  ) then
    create policy tenant_read_portfolios on storage.objects
      for select
      using (
        bucket_id = 'portfolios'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_write_portfolios'
  ) then
    create policy tenant_write_portfolios on storage.objects
      for insert
      with check (
        bucket_id = 'portfolios'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_update_portfolios'
  ) then
    create policy tenant_update_portfolios on storage.objects
      for update
      using (
        bucket_id = 'portfolios'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      )
      with check (
        bucket_id = 'portfolios'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_delete_portfolios'
  ) then
    create policy tenant_delete_portfolios on storage.objects
      for delete
      using (
        bucket_id = 'portfolios'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  -- ============================================================
  -- avatares (lectura publica, escritura por tenant)
  -- ============================================================
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'public_read_avatares'
  ) then
    create policy public_read_avatares on storage.objects
      for select
      using (bucket_id = 'avatares');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_write_avatares'
  ) then
    create policy tenant_write_avatares on storage.objects
      for insert
      with check (
        bucket_id = 'avatares'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_update_avatares'
  ) then
    create policy tenant_update_avatares on storage.objects
      for update
      using (
        bucket_id = 'avatares'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      )
      with check (
        bucket_id = 'avatares'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_delete_avatares'
  ) then
    create policy tenant_delete_avatares on storage.objects
      for delete
      using (
        bucket_id = 'avatares'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;
end $$;
