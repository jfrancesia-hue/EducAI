-- Billing event log for MercadoPago / Stripe webhook idempotency and audit.
-- Each row is a payment provider event: receivedAt timestamps when we got it,
-- processedAt timestamps when our processor finished, outcome captures the
-- decision (e.g. "subscription_activated", "ignored_duplicate").

alter table "Subscription"
  add column if not exists "providerCustomerId" text;

alter table "Subscription"
  add column if not exists "externalReference" text;

create unique index if not exists "Subscription_externalReference_key"
  on "Subscription"("externalReference");

create index if not exists "Subscription_provider_providerSubId_idx"
  on "Subscription"("provider", "providerSubId");

create table if not exists "BillingEvent" (
  "id"              text not null,
  "provider"        text not null,
  "providerEventId" text not null,
  "eventType"       text not null,
  "status"          text not null,
  "subscriptionId"  text,
  "tenantId"        text,
  "payload"         jsonb not null,
  "receivedAt"      timestamp(3) not null default now(),
  "processedAt"     timestamp(3),
  "outcome"         text,
  "errorMessage"    text,

  constraint "BillingEvent_pkey" primary key ("id")
);

create unique index if not exists "BillingEvent_provider_providerEventId_key"
  on "BillingEvent"("provider", "providerEventId");

create index if not exists "BillingEvent_tenantId_idx"
  on "BillingEvent"("tenantId");

create index if not exists "BillingEvent_subscriptionId_idx"
  on "BillingEvent"("subscriptionId");

create index if not exists "BillingEvent_receivedAt_idx"
  on "BillingEvent"("receivedAt");

alter table "BillingEvent"
  add constraint "BillingEvent_subscriptionId_fkey"
  foreign key ("subscriptionId") references "Subscription"("id")
  on delete set null on update cascade;
