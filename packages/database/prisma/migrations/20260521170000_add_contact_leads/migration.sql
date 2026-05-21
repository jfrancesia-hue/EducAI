CREATE TABLE "ContactLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "institution" TEXT,
    "quantity" INTEGER,
    "product" TEXT,
    "plan" TEXT,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'website_contact_form',
    "status" TEXT NOT NULL DEFAULT 'open',
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactLead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactLead_email_idx" ON "ContactLead"("email");
CREATE INDEX "ContactLead_status_idx" ON "ContactLead"("status");
CREATE INDEX "ContactLead_createdAt_idx" ON "ContactLead"("createdAt");
