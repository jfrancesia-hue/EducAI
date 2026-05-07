create extension if not exists "pgcrypto";
create extension if not exists "vector";

create or replace function public.current_tenant_id()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', '')
$$;

create or replace function public.current_user_id()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role'
$$;

-- Prisma creates camelCase table names by default when migrations are generated.
-- These policies are intentionally explicit and should be applied after the first
-- Prisma migration has created the tables.
do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'User',
    'School',
    'Family',
    'Parent',
    'Teacher',
    'Student',
    'Classroom',
    'Subject',
    'Enrollment',
    'StudentProfile',
    'Conversation',
    'Message',
    'LearningSession',
    'Achievement',
    'ParentReport',
    'Subscription',
    'Curriculum',
    'CurriculumGap',
    'LessonPlan',
    'TeacherEnrollment',
    'CommunityPost',
    'CommunityComment',
    'AuditLog'
  ]
  loop
    policy_name := 'tenant_isolation_' || table_name;
    execute format('alter table if exists public.%I enable row level security', table_name);

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = policy_name
    ) then
      execute format(
        'create policy %I on public.%I for all using (public.is_service_role() or "tenantId"::text = public.current_tenant_id()) with check (public.is_service_role() or "tenantId"::text = public.current_tenant_id())',
        policy_name,
        table_name
      );
    end if;
  end loop;
end $$;

do $$
begin
  alter table if exists public."Tenant" enable row level security;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'Tenant'
      and policyname = 'tenant_self_isolation'
  ) then
    create policy tenant_self_isolation on public."Tenant"
      for all
      using (public.is_service_role() or id::text = public.current_tenant_id())
      with check (public.is_service_role() or id::text = public.current_tenant_id());
  end if;

  alter table if exists public."UserRoleAssignment" enable row level security;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'UserRoleAssignment'
      and policyname = 'tenant_isolation_UserRoleAssignment'
  ) then
    create policy "tenant_isolation_UserRoleAssignment" on public."UserRoleAssignment"
      for all
      using (
        public.is_service_role()
        or exists (
          select 1
          from public."User" u
          where u.id = "userId"
            and u."tenantId"::text = public.current_tenant_id()
        )
      )
      with check (
        public.is_service_role()
        or exists (
          select 1
          from public."User" u
          where u.id = "userId"
            and u."tenantId"::text = public.current_tenant_id()
        )
      );
  end if;

  alter table if exists public."RolePermission" enable row level security;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'RolePermission'
      and policyname = 'tenant_isolation_RolePermission'
  ) then
    create policy "tenant_isolation_RolePermission" on public."RolePermission"
      for all
      using (
        public.is_service_role()
        or exists (
          select 1
          from public."Role" r
          where r.id = "roleId"
            and r."tenantId"::text = public.current_tenant_id()
        )
      )
      with check (
        public.is_service_role()
        or exists (
          select 1
          from public."Role" r
          where r.id = "roleId"
            and r."tenantId"::text = public.current_tenant_id()
        )
      );
  end if;

  alter table if exists public."Permission" enable row level security;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'Permission'
      and policyname = 'service_role_only_Permission'
  ) then
    create policy "service_role_only_Permission" on public."Permission"
      for all
      using (public.is_service_role())
      with check (public.is_service_role());
  end if;

  alter table if exists public."ContentLibraryItem" enable row level security;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ContentLibraryItem'
      and policyname = 'authenticated_read_ContentLibraryItem'
  ) then
    create policy "authenticated_read_ContentLibraryItem" on public."ContentLibraryItem"
      for select
      using (public.is_service_role() or public.current_tenant_id() is not null);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ContentLibraryItem'
      and policyname = 'service_role_write_ContentLibraryItem'
  ) then
    create policy "service_role_write_ContentLibraryItem" on public."ContentLibraryItem"
      for insert
      with check (public.is_service_role());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ContentLibraryItem'
      and policyname = 'service_role_update_ContentLibraryItem'
  ) then
    create policy "service_role_update_ContentLibraryItem" on public."ContentLibraryItem"
      for update
      using (public.is_service_role())
      with check (public.is_service_role());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ContentLibraryItem'
      and policyname = 'service_role_delete_ContentLibraryItem'
  ) then
    create policy "service_role_delete_ContentLibraryItem" on public."ContentLibraryItem"
      for delete
      using (public.is_service_role());
  end if;

  alter table if exists public."TeacherCourse" enable row level security;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'TeacherCourse'
      and policyname = 'authenticated_read_TeacherCourse'
  ) then
    create policy "authenticated_read_TeacherCourse" on public."TeacherCourse"
      for select
      using (public.is_service_role() or public.current_tenant_id() is not null);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'TeacherCourse'
      and policyname = 'service_role_write_TeacherCourse'
  ) then
    create policy "service_role_write_TeacherCourse" on public."TeacherCourse"
      for insert
      with check (public.is_service_role());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'TeacherCourse'
      and policyname = 'service_role_update_TeacherCourse'
  ) then
    create policy "service_role_update_TeacherCourse" on public."TeacherCourse"
      for update
      using (public.is_service_role())
      with check (public.is_service_role());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'TeacherCourse'
      and policyname = 'service_role_delete_TeacherCourse'
  ) then
    create policy "service_role_delete_TeacherCourse" on public."TeacherCourse"
      for delete
      using (public.is_service_role());
  end if;
end $$;

insert into storage.buckets (id, name, public)
values
  ('evidencias', 'evidencias', false),
  ('portfolios', 'portfolios', false),
  ('avatares', 'avatares', true)
on conflict (id) do nothing;
