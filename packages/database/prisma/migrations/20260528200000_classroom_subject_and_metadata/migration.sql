-- Add native subject and metadata columns to Classroom so we can stop serializing
-- pedagogical context inside the `shift` column with a "json:" prefix.

ALTER TABLE "Classroom"
  ADD COLUMN "subject"  TEXT,
  ADD COLUMN "metadata" JSONB;

-- Backfill existing rows where TeacherCourseService persisted everything as a
-- JSON blob inside `shift` (prefixed with "json:"). After this migration the
-- service writes natively, but classrooms created before today have all the
-- context buried in `shift`.
WITH parsed AS (
  SELECT
    "id",
    CASE
      WHEN "shift" LIKE 'json:%'
        THEN substring("shift" FROM 6)::jsonb
      ELSE NULL
    END AS payload,
    "shift" AS raw_shift
  FROM "Classroom"
)
UPDATE "Classroom" AS c
SET
  "subject"  = COALESCE(c."subject", parsed.payload->>'subject'),
  "shift"    = COALESCE(parsed.payload->>'shift', NULLIF(parsed.raw_shift, '')),
  "metadata" = CASE
    WHEN parsed.payload IS NULL THEN c."metadata"
    ELSE COALESCE(
      c."metadata",
      jsonb_strip_nulls(
        jsonb_build_object(
          'studentCount',
          NULLIF((parsed.payload->>'studentCount'), '')::int
        )
      )
    )
  END
FROM parsed
WHERE c."id" = parsed."id"
  AND parsed.raw_shift IS NOT NULL
  AND parsed.raw_shift LIKE 'json:%';

-- After this point, no Classroom row should carry the legacy `json:...` blob in
-- `shift`. Service code reads both layouts for one release as a safety net.
