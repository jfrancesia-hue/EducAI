-- Storage policies para los 3 buckets de EducAI (educai-*).
-- El proyecto Supabase es compartido con IncluIA: los buckets historicos sin
-- prefijo (evidencias/portfolios/avatares) quedan reservados para IncluIA u
-- otro consumidor. EducAI usa exclusivamente los educai-* desde 2026-05-08.
-- Convencion de paths: {tenantId}/{...} para los 3 buckets.
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
      and policyname = 'tenant_read_educai_evidencias'
  ) then
    create policy tenant_read_educai_evidencias on storage.objects
      for select
      using (
        bucket_id = 'educai-evidencias'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_write_educai_evidencias'
  ) then
    create policy tenant_write_educai_evidencias on storage.objects
      for insert
      with check (
        bucket_id = 'educai-evidencias'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_update_educai_evidencias'
  ) then
    create policy tenant_update_educai_evidencias on storage.objects
      for update
      using (
        bucket_id = 'educai-evidencias'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      )
      with check (
        bucket_id = 'educai-evidencias'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_delete_educai_evidencias'
  ) then
    create policy tenant_delete_educai_evidencias on storage.objects
      for delete
      using (
        bucket_id = 'educai-evidencias'
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
      and policyname = 'tenant_read_educai_portfolios'
  ) then
    create policy tenant_read_educai_portfolios on storage.objects
      for select
      using (
        bucket_id = 'educai-portfolios'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_write_educai_portfolios'
  ) then
    create policy tenant_write_educai_portfolios on storage.objects
      for insert
      with check (
        bucket_id = 'educai-portfolios'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_update_educai_portfolios'
  ) then
    create policy tenant_update_educai_portfolios on storage.objects
      for update
      using (
        bucket_id = 'educai-portfolios'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      )
      with check (
        bucket_id = 'educai-portfolios'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_delete_educai_portfolios'
  ) then
    create policy tenant_delete_educai_portfolios on storage.objects
      for delete
      using (
        bucket_id = 'educai-portfolios'
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
      and policyname = 'public_read_educai_avatares'
  ) then
    create policy public_read_educai_avatares on storage.objects
      for select
      using (bucket_id = 'educai-avatares');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_write_educai_avatares'
  ) then
    create policy tenant_write_educai_avatares on storage.objects
      for insert
      with check (
        bucket_id = 'educai-avatares'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_update_educai_avatares'
  ) then
    create policy tenant_update_educai_avatares on storage.objects
      for update
      using (
        bucket_id = 'educai-avatares'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      )
      with check (
        bucket_id = 'educai-avatares'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'tenant_delete_educai_avatares'
  ) then
    create policy tenant_delete_educai_avatares on storage.objects
      for delete
      using (
        bucket_id = 'educai-avatares'
        and (
          public.is_service_role()
          or storage.educai_object_tenant_id(name) = public.current_tenant_id()
        )
      );
  end if;
end $$;
