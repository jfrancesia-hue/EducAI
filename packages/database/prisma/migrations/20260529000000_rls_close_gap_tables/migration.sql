-- Cierra los huecos de RLS en tablas tenant-scoped del schema `educai` que se
-- habían creado SIN row level security: EducaiWhatsappContact, BillingEvent y
-- ProcessedTwilioMessage. Las tres llevan `tenantId` y contienen datos sensibles
-- (teléfonos de menores, eventos de pago, dedupe de mensajes).
--
-- Modelo de aislamiento (igual que UsageCreditLedger / ParentalConsent):
--   * `educai_app` (rol de la app, DUEÑO de las tablas) sigue accediendo porque el
--     dueño bypassa RLS mientras no esté FORCE. La barrera del path de la app es el
--     middleware de Prisma (fail-closed) en la capa de aplicación.
--   * Los roles NO dueño (anon, authenticated, service_role vía PostgREST y cualquier
--     acceso del proyecto Supabase compartido / IncluAI) quedan acotados por estas
--     policies: solo ven filas de su tenant, y solo el service role escribe.
--   * Filas con `tenantId` NULL (eventos de sistema en BillingEvent/ProcessedTwilioMessage)
--     solo son visibles para el service role.
--
-- Migración aditiva e idempotente: no toca `public`/IncluAI ni datos existentes.

SET search_path = educai, public;

-- ---------------------------------------------------------------------------
-- Helper local: crea una policy solo si no existe (CREATE POLICY no soporta IF NOT EXISTS).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  has_roles boolean;
BEGIN
  -- Grants idempotentes hacia los roles de Supabase, solo si existen (en una DB
  -- local sin esos roles esto se omite sin romper la migración).
  SELECT count(*) = 4 INTO has_roles
  FROM pg_roles
  WHERE rolname IN ('educai_app', 'authenticated', 'service_role', 'anon');

  -- EducaiWhatsappContact -----------------------------------------------------
  EXECUTE 'ALTER TABLE IF EXISTS "EducaiWhatsappContact" ENABLE ROW LEVEL SECURITY';

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'educai' AND tablename = 'EducaiWhatsappContact'
      AND policyname = 'EducaiWhatsappContact_tenant_select'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "EducaiWhatsappContact_tenant_select"
        ON "EducaiWhatsappContact"
        FOR SELECT
        USING (educai.is_service_role() OR "tenantId" = educai.current_tenant_id())
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'educai' AND tablename = 'EducaiWhatsappContact'
      AND policyname = 'EducaiWhatsappContact_service_write'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "EducaiWhatsappContact_service_write"
        ON "EducaiWhatsappContact"
        FOR ALL
        USING (educai.is_service_role())
        WITH CHECK (educai.is_service_role())
    $p$;
  END IF;

  -- BillingEvent --------------------------------------------------------------
  EXECUTE 'ALTER TABLE IF EXISTS "BillingEvent" ENABLE ROW LEVEL SECURITY';

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'educai' AND tablename = 'BillingEvent'
      AND policyname = 'BillingEvent_tenant_select'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "BillingEvent_tenant_select"
        ON "BillingEvent"
        FOR SELECT
        USING (educai.is_service_role() OR "tenantId" = educai.current_tenant_id())
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'educai' AND tablename = 'BillingEvent'
      AND policyname = 'BillingEvent_service_write'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "BillingEvent_service_write"
        ON "BillingEvent"
        FOR ALL
        USING (educai.is_service_role())
        WITH CHECK (educai.is_service_role())
    $p$;
  END IF;

  -- ProcessedTwilioMessage ----------------------------------------------------
  EXECUTE 'ALTER TABLE IF EXISTS "ProcessedTwilioMessage" ENABLE ROW LEVEL SECURITY';

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'educai' AND tablename = 'ProcessedTwilioMessage'
      AND policyname = 'ProcessedTwilioMessage_tenant_select'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "ProcessedTwilioMessage_tenant_select"
        ON "ProcessedTwilioMessage"
        FOR SELECT
        USING (educai.is_service_role() OR "tenantId" = educai.current_tenant_id())
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'educai' AND tablename = 'ProcessedTwilioMessage'
      AND policyname = 'ProcessedTwilioMessage_service_write'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "ProcessedTwilioMessage_service_write"
        ON "ProcessedTwilioMessage"
        FOR ALL
        USING (educai.is_service_role())
        WITH CHECK (educai.is_service_role())
    $p$;
  END IF;

  -- Grants (solo si los roles Supabase existen) -------------------------------
  IF has_roles THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON "EducaiWhatsappContact" TO educai_app';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON "BillingEvent" TO educai_app';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON "ProcessedTwilioMessage" TO educai_app';

    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON "EducaiWhatsappContact" TO authenticated, service_role';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON "BillingEvent" TO authenticated, service_role';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON "ProcessedTwilioMessage" TO authenticated, service_role';

    EXECUTE 'GRANT SELECT ON "EducaiWhatsappContact" TO anon';
    EXECUTE 'GRANT SELECT ON "BillingEvent" TO anon';
    EXECUTE 'GRANT SELECT ON "ProcessedTwilioMessage" TO anon';
  END IF;
END $$;
