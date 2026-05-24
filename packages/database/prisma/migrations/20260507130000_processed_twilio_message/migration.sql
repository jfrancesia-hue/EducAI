-- Idempotency table for Twilio inbound webhooks.
-- Twilio retries up to 3 times if the webhook response takes >15s.
-- Without idempotency, the orchestrator would re-invoke Claude (cost) and
-- send duplicate WhatsApp replies to the student.

create table if not exists "ProcessedTwilioMessage" (
  "messageSid"  text not null,
  "receivedAt"  timestamp(3) not null default now(),
  "completedAt" timestamp(3),
  "outcome"     text not null default 'received',
  "tenantId"    text,
  "studentId"   text,

  constraint "ProcessedTwilioMessage_pkey" primary key ("messageSid")
);

create index if not exists "ProcessedTwilioMessage_receivedAt_idx"
  on "ProcessedTwilioMessage"("receivedAt");

create index if not exists "ProcessedTwilioMessage_tenantId_idx"
  on "ProcessedTwilioMessage"("tenantId");
