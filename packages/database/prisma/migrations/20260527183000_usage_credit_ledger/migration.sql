-- Track purchased/manual usage credits without touching public/IncluAI objects.
-- LessonPlan remains the source of consumption for EducAI planning usage.

SET search_path = educai, public;

CREATE TABLE "UsageCreditLedger" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "teacherId" TEXT,
  "product" "EducaiProduct" NOT NULL,
  "unit" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "source" TEXT NOT NULL,
  "reason" TEXT,
  "referenceId" TEXT,
  "metadata" JSONB,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UsageCreditLedger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UsageCreditLedger_tenantId_product_unit_idx"
  ON "UsageCreditLedger"("tenantId", "product", "unit");
CREATE INDEX "UsageCreditLedger_teacherId_idx" ON "UsageCreditLedger"("teacherId");
CREATE INDEX "UsageCreditLedger_referenceId_idx" ON "UsageCreditLedger"("referenceId");
CREATE INDEX "UsageCreditLedger_expiresAt_idx" ON "UsageCreditLedger"("expiresAt");
CREATE INDEX "UsageCreditLedger_createdAt_idx" ON "UsageCreditLedger"("createdAt");

ALTER TABLE "UsageCreditLedger"
  ADD CONSTRAINT "UsageCreditLedger_tenantId_fkey"
  FOREIGN KEY ("tenantId")
  REFERENCES "Tenant"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "UsageCreditLedger"
  ADD CONSTRAINT "UsageCreditLedger_teacherId_fkey"
  FOREIGN KEY ("teacherId")
  REFERENCES "Teacher"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER
  ON "UsageCreditLedger" TO educai_app;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON "UsageCreditLedger" TO authenticated, service_role;
GRANT SELECT ON "UsageCreditLedger" TO anon;

ALTER TABLE "UsageCreditLedger" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "UsageCreditLedger_tenant_select"
  ON "UsageCreditLedger"
  FOR SELECT
  USING (
    educai.is_service_role()
    OR "tenantId" = educai.current_tenant_id()
  );

CREATE POLICY "UsageCreditLedger_service_write"
  ON "UsageCreditLedger"
  FOR ALL
  USING (educai.is_service_role())
  WITH CHECK (educai.is_service_role());
