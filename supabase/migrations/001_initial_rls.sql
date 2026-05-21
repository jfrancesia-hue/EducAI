create extension if not exists "pgcrypto";
create extension if not exists "vector";

create or replace function public.current_tenant_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('app.tenant_id', true), ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', '')
  )
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select
    coalesce(current_setting('app.bypass_rls', true), '') = 'true'
    or coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role'
$$;

-- These policies apply only to tenant-scoped tables in the EducAI schema.
-- Public intake tables such as ContactLead are intentionally excluded because
-- they are not tenant-scoped and must accept anonymous writes from the website.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'User',
    'Role',
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
    execute format('alter table if exists educai.%I enable row level security', table_name);
    execute format(
      'create policy if not exists %I on educai.%I for all using (public.is_service_role() or "tenantId"::text = public.current_tenant_id()) with check (public.is_service_role() or "tenantId"::text = public.current_tenant_id())',
      'tenant_isolation_' || table_name,
      table_name
    );
  end loop;
end $$;

insert into storage.buckets (id, name, public)
values
  ('evidencias', 'evidencias', false),
  ('portfolios', 'portfolios', false),
  ('avatares', 'avatares', true)
on conflict (id) do nothing;

