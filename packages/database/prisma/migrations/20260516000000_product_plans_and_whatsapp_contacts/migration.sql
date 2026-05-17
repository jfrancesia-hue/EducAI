-- Separate EducAI and ApoyoAI subscriptions and allow both parent and child WhatsApp contacts.
-- Additive migration for the `educai` schema: no public/IncluAI table is touched.

CREATE TYPE "EducaiProduct" AS ENUM ('EDUCAI', 'APOYOAI');
CREATE TYPE "EducaiWhatsappContactRole" AS ENUM ('STUDENT', 'PARENT', 'GUARDIAN');

ALTER TABLE "Subscription"
  ADD COLUMN "product" "EducaiProduct" NOT NULL DEFAULT 'APOYOAI',
  ADD COLUMN "planCode" TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS "providerCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "externalReference" TEXT;

CREATE TABLE "EducaiWhatsappContact" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "role" "EducaiWhatsappContactRole" NOT NULL,
  "phone" TEXT NOT NULL,
  "displayName" TEXT,
  "canReceiveTutor" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "EducaiWhatsappContact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EducaiWhatsappContact_studentProfileId_role_phone_key"
  ON "EducaiWhatsappContact"("studentProfileId", "role", "phone");

CREATE INDEX "EducaiWhatsappContact_tenantId_idx" ON "EducaiWhatsappContact"("tenantId");
CREATE INDEX "EducaiWhatsappContact_phone_idx" ON "EducaiWhatsappContact"("phone");
CREATE INDEX "EducaiWhatsappContact_deletedAt_idx" ON "EducaiWhatsappContact"("deletedAt");

ALTER TABLE "EducaiWhatsappContact"
  ADD CONSTRAINT "EducaiWhatsappContact_studentProfileId_fkey"
  FOREIGN KEY ("studentProfileId")
  REFERENCES "StudentProfile"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

INSERT INTO "EducaiWhatsappContact" (
  "id",
  "tenantId",
  "studentProfileId",
  "role",
  "phone",
  "displayName",
  "createdAt",
  "updatedAt"
)
SELECT
  'sct_' || replace(gen_random_uuid()::text, '-', ''),
  sp."tenantId",
  sp."id",
  'STUDENT'::"EducaiWhatsappContactRole",
  sp."whatsappPhone",
  s."firstName",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "StudentProfile" sp
JOIN "Student" s ON s."id" = sp."studentId"
WHERE sp."whatsappPhone" IS NOT NULL
ON CONFLICT ("studentProfileId", "role", "phone") DO NOTHING;
