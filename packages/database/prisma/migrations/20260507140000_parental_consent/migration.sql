-- Verifiable parental consent for processing minors' data.
-- Required by Ley 26.061 (AR), LGPD art. 14 §1 (BR) and COPPA §312.5 (US).
-- Each row is a parent/guardian's signature for one student and one
-- document version. Revocable via revokedAt + revocationReason.

create table if not exists "ParentalConsent" (
  "id"                    text not null,
  "tenantId"              text not null,
  "studentId"             text not null,
  "parentUserId"          text not null,
  "documentVersion"       text not null,
  "termsAccepted"         boolean not null,
  "privacyAccepted"       boolean not null,
  "aiProcessingAccepted"  boolean not null,
  "signedAt"              timestamp(3) not null default now(),
  "ipAddress"             text not null,
  "userAgent"             varchar(512) not null,
  "revokedAt"             timestamp(3),
  "revokedByUserId"       text,
  "revocationReason"      varchar(512),
  "metadata"              jsonb,
  "createdAt"             timestamp(3) not null default now(),
  "updatedAt"             timestamp(3) not null,

  constraint "ParentalConsent_pkey" primary key ("id")
);

create unique index if not exists "ParentalConsent_studentId_documentVersion_parentUserId_key"
  on "ParentalConsent"("studentId", "documentVersion", "parentUserId");

create index if not exists "ParentalConsent_tenantId_idx"
  on "ParentalConsent"("tenantId");

create index if not exists "ParentalConsent_studentId_revokedAt_idx"
  on "ParentalConsent"("studentId", "revokedAt");

create index if not exists "ParentalConsent_parentUserId_idx"
  on "ParentalConsent"("parentUserId");

alter table "ParentalConsent"
  add constraint "ParentalConsent_studentId_fkey"
  foreign key ("studentId") references "Student"("id")
  on delete cascade on update cascade;

alter table "ParentalConsent"
  add constraint "ParentalConsent_parentUserId_fkey"
  foreign key ("parentUserId") references "User"("id")
  on delete restrict on update cascade;

alter table "ParentalConsent"
  add constraint "ParentalConsent_revokedByUserId_fkey"
  foreign key ("revokedByUserId") references "User"("id")
  on delete set null on update cascade;

-- RLS: tenant isolation. Service role bypass.
alter table "ParentalConsent" enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ParentalConsent'
      and policyname = 'tenant_isolation_ParentalConsent'
  ) then
    create policy "tenant_isolation_ParentalConsent" on public."ParentalConsent"
      for all
      using (
        public.is_service_role()
        or "tenantId"::text = public.current_tenant_id()
      )
      with check (
        public.is_service_role()
        or "tenantId"::text = public.current_tenant_id()
      );
  end if;
end $$;
