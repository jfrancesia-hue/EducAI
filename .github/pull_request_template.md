# Qué cambia

<!-- Resumen corto (1-3 líneas). Mencioná fase, módulo, y tipo (feat / fix / chore / refactor / docs / test). -->

## Por qué

<!-- Contexto de negocio o técnico. Link a docs/claude/*.md si aplica. -->

## Cómo probar

- [ ] `pnpm install`
- [ ] `pnpm docker:up && pnpm db:migrate && pnpm db:seed`
- [ ] `pnpm dev` / `pnpm test` / `pnpm typecheck` / `pnpm lint`
- [ ] Pasos específicos de esta PR:

## Checklist Fase 0+

- [ ] Multi-tenant: respeto de `tenantId` en cada query / RLS.
- [ ] Seguridad de menores: no se exponen datos de alumnos sin permiso parental.
- [ ] Seguridad pedagógica (si toca tutor IA): no se rompe el patrón socrático.
- [ ] i18n: textos visibles extraídos a `packages/i18n`.
- [ ] WCAG 2.1 AA: contraste + foco visible + labels.
- [ ] Tests nuevos o actualizados (≥70% cobertura en lógica de negocio).
- [ ] ADR creada si hay decisión arquitectónica no trivial.

## Riesgos / rollback

<!-- Qué podría romperse y cómo se revierte. -->
