create extension if not exists "pgcrypto";
create extension if not exists "vector";

create or replace function public.current_tenant_id()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', '')
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role'
$$;

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
