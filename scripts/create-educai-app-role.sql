-- Create the educai_app login role with NOBYPASSRLS for the API.
--
-- Idempotent: safe to re-run. Resets the password to <PASSWORD_PLACEHOLDER>
-- on every run, so you must edit the placeholder before applying.
--
-- Apply with:
--   pnpm prisma db execute \
--     --file scripts/create-educai-app-role.sql \
--     --schema packages/database/prisma/schema.prisma
-- (using DATABASE_URL of the postgres superuser)

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'educai_app') then
    create role educai_app with login password 'umFfWkfPzadgIIOBLffyHDsfMYmxTiuU' nobypassrls;
  else
    alter role educai_app with password 'umFfWkfPzadgIIOBLffyHDsfMYmxTiuU';
    alter role educai_app nobypassrls;
  end if;
end $$;

grant usage on schema public to educai_app;

grant select, insert, update, delete on all tables in schema public to educai_app;
grant usage, select on all sequences in schema public to educai_app;
grant execute on all functions in schema public to educai_app;

alter default privileges in schema public grant select, insert, update, delete on tables to educai_app;
alter default privileges in schema public grant usage, select on sequences to educai_app;
alter default privileges in schema public grant execute on functions to educai_app;
