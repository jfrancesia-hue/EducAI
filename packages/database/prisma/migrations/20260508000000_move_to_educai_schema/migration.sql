-- Mueve todas las tablas, enums y _prisma_migrations de EducAI desde public
-- al schema dedicado "educai". El proyecto Supabase es compartido con IncluIA,
-- y separar por schema garantiza aislamiento limpio: IncluIA queda intacta en
-- public con sus 7 tablas snake_case (perfiles, consultas, pagos, ppi_*, etc.).
--
-- Hallazgos previos a esta migracion (verificados en prod 2026-05-08):
-- - 32 tablas EducAI + _prisma_migrations en public (PascalCase)
-- - 7 tablas IncluIA en public (snake_case)
-- - 4 enums EducAI (SubscriptionPlan, SubscriptionStatus, TenantType, UserRole)
-- - 3 funciones helper RLS de EducAI (current_tenant_id, current_user_id, is_service_role)
-- - 40 RLS policies en tablas EducAI (todas se preservan con SET SCHEMA)
-- - 0 objetos en buckets storage (renombrar libre)
--
-- Todo en una transaccion: si algo falla, ROLLBACK limpia.

-- 1) Schema dedicado a EducAI
CREATE SCHEMA IF NOT EXISTS educai;
GRANT USAGE ON SCHEMA educai TO postgres, anon, authenticated, service_role, educai_app;
GRANT CREATE ON SCHEMA educai TO postgres;

-- 2) Mover los 4 enums de EducAI (deben ir antes que las tablas que los usan)
ALTER TYPE public."SubscriptionPlan" SET SCHEMA educai;
ALTER TYPE public."SubscriptionStatus" SET SCHEMA educai;
ALTER TYPE public."TenantType" SET SCHEMA educai;
ALTER TYPE public."UserRole" SET SCHEMA educai;

-- 3) Crear copias de los helpers RLS en schema educai (las de public quedan
--    intactas, IncluIA puede seguir usando current_tenant_id/is_service_role
--    de public). Las RLS policies actuales referencian el nombre sin
--    schema-qualify y se resuelven via search_path -> public.*; en una
--    proxima limpieza migraremos las refs a educai.*.
CREATE OR REPLACE FUNCTION educai.current_tenant_id() RETURNS text
LANGUAGE sql STABLE AS $fn$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'tenant_id', '')
$fn$;

CREATE OR REPLACE FUNCTION educai.current_user_id() RETURNS text
LANGUAGE sql STABLE AS $fn$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')
$fn$;

CREATE OR REPLACE FUNCTION educai.is_service_role() RETURNS boolean
LANGUAGE sql STABLE AS $fn$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role'
$fn$;

GRANT EXECUTE ON FUNCTION educai.current_tenant_id() TO postgres, anon, authenticated, service_role, educai_app;
GRANT EXECUTE ON FUNCTION educai.current_user_id() TO postgres, anon, authenticated, service_role, educai_app;
GRANT EXECUTE ON FUNCTION educai.is_service_role() TO postgres, anon, authenticated, service_role, educai_app;

-- 4) Mover las 33 tablas de EducAI (32 modelos Prisma + _prisma_migrations)
ALTER TABLE public."Achievement" SET SCHEMA educai;
ALTER TABLE public."AuditLog" SET SCHEMA educai;
ALTER TABLE public."BillingEvent" SET SCHEMA educai;
ALTER TABLE public."Classroom" SET SCHEMA educai;
ALTER TABLE public."CommunityComment" SET SCHEMA educai;
ALTER TABLE public."CommunityPost" SET SCHEMA educai;
ALTER TABLE public."ContentLibraryItem" SET SCHEMA educai;
ALTER TABLE public."Conversation" SET SCHEMA educai;
ALTER TABLE public."Curriculum" SET SCHEMA educai;
ALTER TABLE public."CurriculumGap" SET SCHEMA educai;
ALTER TABLE public."Enrollment" SET SCHEMA educai;
ALTER TABLE public."Family" SET SCHEMA educai;
ALTER TABLE public."LearningSession" SET SCHEMA educai;
ALTER TABLE public."LessonPlan" SET SCHEMA educai;
ALTER TABLE public."Message" SET SCHEMA educai;
ALTER TABLE public."Parent" SET SCHEMA educai;
ALTER TABLE public."ParentReport" SET SCHEMA educai;
ALTER TABLE public."ParentalConsent" SET SCHEMA educai;
ALTER TABLE public."Permission" SET SCHEMA educai;
ALTER TABLE public."ProcessedTwilioMessage" SET SCHEMA educai;
ALTER TABLE public."Role" SET SCHEMA educai;
ALTER TABLE public."RolePermission" SET SCHEMA educai;
ALTER TABLE public."School" SET SCHEMA educai;
ALTER TABLE public."Student" SET SCHEMA educai;
ALTER TABLE public."StudentProfile" SET SCHEMA educai;
ALTER TABLE public."Subject" SET SCHEMA educai;
ALTER TABLE public."Subscription" SET SCHEMA educai;
ALTER TABLE public."Teacher" SET SCHEMA educai;
ALTER TABLE public."TeacherCourse" SET SCHEMA educai;
ALTER TABLE public."TeacherEnrollment" SET SCHEMA educai;
ALTER TABLE public."Tenant" SET SCHEMA educai;
ALTER TABLE public."User" SET SCHEMA educai;
ALTER TABLE public."UserRoleAssignment" SET SCHEMA educai;
ALTER TABLE public._prisma_migrations SET SCHEMA educai;

-- 5) Grants y default privileges sobre el nuevo schema
GRANT USAGE ON SCHEMA educai TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA educai TO educai_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA educai TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA educai TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA educai TO educai_app, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA educai TO educai_app, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA educai
  GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO educai_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA educai
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA educai
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA educai
  GRANT USAGE, SELECT ON SEQUENCES TO educai_app, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA educai
  GRANT EXECUTE ON FUNCTIONS TO educai_app, authenticated, service_role;
