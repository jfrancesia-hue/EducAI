-- Keep EducAI RLS self-contained in the dedicated educai schema.
-- IncluAI remains in public; this migration does not touch public tables or policies.

CREATE OR REPLACE FUNCTION educai.current_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
AS $fn$
  SELECT COALESCE(
    NULLIF(current_setting('app.tenant_id', true), ''),
    NULLIF(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'tenant_id', '')
  )
$fn$;

CREATE OR REPLACE FUNCTION educai.current_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $fn$
  SELECT COALESCE(
    NULLIF(current_setting('app.user_id', true), ''),
    NULLIF(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')
  )
$fn$;

CREATE OR REPLACE FUNCTION educai.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
AS $fn$
  SELECT
    COALESCE(current_setting('app.bypass_rls', true), '') = 'true'
    OR COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role'
$fn$;

GRANT EXECUTE ON FUNCTION educai.current_tenant_id() TO postgres, anon, authenticated, service_role, educai_app;
GRANT EXECUTE ON FUNCTION educai.current_user_id() TO postgres, anon, authenticated, service_role, educai_app;
GRANT EXECUTE ON FUNCTION educai.is_service_role() TO postgres, anon, authenticated, service_role, educai_app;

DO $$
DECLARE
  policy_record record;
  roles_sql text;
  using_sql text;
  check_sql text;
BEGIN
  FOR policy_record IN
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'educai'
      AND (
        qual LIKE '%public.current_tenant_id()%'
        OR qual LIKE '%public.current_user_id()%'
        OR qual LIKE '%public.is_service_role()%'
        OR with_check LIKE '%public.current_tenant_id()%'
        OR with_check LIKE '%public.current_user_id()%'
        OR with_check LIKE '%public.is_service_role()%'
      )
  LOOP
    roles_sql := CASE
      WHEN policy_record.roles = ARRAY['public']::name[] THEN ''
      ELSE ' TO ' || (
        SELECT string_agg(quote_ident(role_name::text), ', ')
        FROM unnest(policy_record.roles) AS role_name
      )
    END;

    using_sql := CASE
      WHEN policy_record.qual IS NULL THEN ''
      ELSE ' USING (' || replace(
        replace(
          replace(policy_record.qual, 'public.current_tenant_id()', 'educai.current_tenant_id()'),
          'public.current_user_id()', 'educai.current_user_id()'
        ),
        'public.is_service_role()', 'educai.is_service_role()'
      ) || ')'
    END;

    check_sql := CASE
      WHEN policy_record.with_check IS NULL THEN ''
      ELSE ' WITH CHECK (' || replace(
        replace(
          replace(policy_record.with_check, 'public.current_tenant_id()', 'educai.current_tenant_id()'),
          'public.current_user_id()', 'educai.current_user_id()'
        ),
        'public.is_service_role()', 'educai.is_service_role()'
      ) || ')'
    END;

    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );

    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s%s%s%s',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename,
      policy_record.permissive,
      policy_record.cmd,
      roles_sql,
      using_sql,
      check_sql
    );
  END LOOP;
END $$;
