-- =====================================================================
-- Validación de RLS para EducAI — 100% no destructivo.
--   Parte A: prueba la LÓGICA de las policies en una transacción que hace
--            ROLLBACK (no deja nada: ni rol, ni schema, ni datos).
--   Parte B: inspección READ-ONLY del estado real del schema `educai`
--            (dueño de tablas, RLS habilitada, FORCE, policies).
--
-- Uso (desde la terminal, no necesito tu password si lo corrés vos):
--   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d educai `
--       -v ON_ERROR_STOP=1 -f packages\database\scripts\validate-rls.sql
-- (cambiá -d educai por el nombre real de tu base si difiere)
-- =====================================================================

\echo '################ PARTE A — lógica de policies (rollback al final) ################'

BEGIN;

CREATE ROLE rls_probe_user NOLOGIN;
CREATE SCHEMA rls_probe;

-- Réplica mínima de las funciones reales de `educai`.
CREATE FUNCTION rls_probe.current_tenant_id() RETURNS text LANGUAGE sql STABLE AS
  $fn$ SELECT NULLIF(current_setting('app.tenant_id', true), '') $fn$;
CREATE FUNCTION rls_probe.is_service_role() RETURNS boolean LANGUAGE sql STABLE AS
  $fn$ SELECT COALESCE(current_setting('app.bypass_rls', true), '') = 'true' $fn$;

GRANT USAGE ON SCHEMA rls_probe TO rls_probe_user;
GRANT EXECUTE ON FUNCTION rls_probe.current_tenant_id() TO rls_probe_user;
GRANT EXECUTE ON FUNCTION rls_probe.is_service_role() TO rls_probe_user;

-- Tabla de prueba con la MISMA expresión de policy que la migración.
CREATE TABLE rls_probe.t ("id" text, "tenantId" text);
INSERT INTO rls_probe.t VALUES ('a', 'tnt_A'), ('b', 'tnt_B'), ('sys', NULL);
GRANT SELECT ON rls_probe.t TO rls_probe_user;

ALTER TABLE rls_probe.t ENABLE ROW LEVEL SECURITY;
CREATE POLICY t_tenant_select ON rls_probe.t
  FOR SELECT
  USING (rls_probe.is_service_role() OR "tenantId" = rls_probe.current_tenant_id());

-- Pasamos al rol NO dueño (RLS aplica) para probar el aislamiento real.
SET LOCAL ROLE rls_probe_user;

SET LOCAL app.tenant_id = 'tnt_A';
\echo '-- Tenant A (sin service): debe ver SOLO "a"'
SELECT coalesce(string_agg(id, ',' ORDER BY id), '<vacio>') AS tenant_a_ve FROM rls_probe.t;

SET LOCAL app.tenant_id = 'tnt_B';
\echo '-- Tenant B (sin service): debe ver SOLO "b"'
SELECT coalesce(string_agg(id, ',' ORDER BY id), '<vacio>') AS tenant_b_ve FROM rls_probe.t;

SET LOCAL app.tenant_id = '';
\echo '-- Sin tenant y sin service: debe ver NADA (<vacio>)'
SELECT coalesce(string_agg(id, ',' ORDER BY id), '<vacio>') AS sin_tenant_ve FROM rls_probe.t;

SET LOCAL app.bypass_rls = 'true';
\echo '-- Service role (bypass): debe ver TODO -> a,b,sys'
SELECT coalesce(string_agg(id, ',' ORDER BY id), '<vacio>') AS service_ve FROM rls_probe.t;

RESET ROLE;
ROLLBACK;

\echo ''
\echo '################ PARTE B — estado real del schema educai (read-only) ################'

\echo '-- Dueño de cada tabla educai (si es educai_app => bypass por ownership, esperado):'
SELECT tablename, tableowner,
       rowsecurity      AS rls_enabled,
       forcerowsecurity AS rls_forced
FROM pg_tables
WHERE schemaname = 'educai'
ORDER BY rowsecurity, tablename;

\echo ''
\echo '-- ¿Las 3 tablas del gap ya tienen RLS + policies? (tras aplicar la migración deberían):'
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'educai'
  AND tablename IN ('EducaiWhatsappContact', 'BillingEvent', 'ProcessedTwilioMessage')
ORDER BY tablename, policyname;

\echo ''
\echo '-- Tablas educai con tenantId SIN RLS habilitada (idealmente 0 filas):'
SELECT c.relname AS tabla_sin_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenantId' AND a.attnum > 0
WHERE n.nspname = 'educai'
  AND c.relkind = 'r'
  AND c.relrowsecurity = false
ORDER BY c.relname;
