# @educai/web

Portal web de ApoyoAI (padres) y de colegios EducAI. Next.js 14 App Router + Tailwind + shadcn
(via `@educai/ui`).

## Secciones

- `/` — landing pública ApoyoAI (conversión padres).
- `/onboarding` — multi-step post-registro (padre → hijo → consentimiento → WhatsApp → diagnóstico).
- `/panel` — dashboard del padre (progreso del hijo, reportes, conversaciones resumidas).
- `/colegios` — landing institucional EducAI.
- `/admin/colegio/*` — dashboard del colegio (Fase 2).

Fase 0 tiene el stub del home con branding. Fases 1 y 2 implementan los flujos.

## Arranque local

```bash
pnpm --filter @educai/web dev
```

`http://localhost:3000` sirve el portal.

## Switch de identidad visual

El layout raíz setea `<html data-brand="apoyoai">`. Para vistas institucionales EducAI, usar un
sub-layout con `data-brand="educai"`. El CSS de `@educai/ui/styles/globals.css` cambia los
tokens (`--primary`, `--accent`, `--ring`) automáticamente.
