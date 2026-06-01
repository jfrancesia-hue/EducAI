-- Endurecimiento de RLS en `educai` (defensa en profundidad):
--
--  1) ContactLead: tabla de intake comercial (sin tenantId) que se creó SIN RLS y con
--     GRANT SELECT a `anon`. Contiene PII (email, nombre, institución, ip, userAgent).
--     Habilitamos RLS con solo escritura de service/owner y SIN policy de lectura pública,
--     de modo que ningún rol no-dueño pueda leer los leads. La app inserta con `educai_app`
--     (dueño de la tabla → bypassa RLS mientras no haya FORCE), así que el formulario
--     público sigue funcionando.
--
--  2) Revocamos SELECT a `anon` sobre TODO el schema `educai` y ajustamos los default
--     privileges para que tablas futuras tampoco lo otorguen. Hoy `educai` no está
--     expuesto vía PostgREST, pero si alguna vez se expusiera, este revoke evita que la
--     anon key pública (presente en el frontend) pueda leer datos sensibles.
--
-- Migración aditiva e idempotente. No toca `public`/IncluAI ni datos existentes.

SET search_path = educai, public;

DO $$
DECLARE
  has_anon boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') INTO has_anon;

  -- 1) ContactLead: RLS + solo escritura de service role / dueño ------------------
  EXECUTE 'ALTER TABLE IF EXISTS "ContactLead" ENABLE ROW LEVEL SECURITY';

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'educai' AND tablename = 'ContactLead'
      AND policyname = 'ContactLead_service_only'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "ContactLead_service_only"
        ON "ContactLead"
        FOR ALL
        USING (educai.is_service_role())
        WITH CHECK (educai.is_service_role())
    $p$;
  END IF;

  -- 2) Revoke de lectura a anon sobre el schema completo --------------------------
  IF has_anon THEN
    EXECUTE 'REVOKE SELECT ON ALL TABLES IN SCHEMA educai FROM anon';
    -- Tablas futuras: que el default tampoco otorgue SELECT a anon.
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA educai REVOKE SELECT ON TABLES FROM anon';
  END IF;
END $$;
