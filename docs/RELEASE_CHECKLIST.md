# Release Checklist

Checklist operativa para mover EducAI o ApoyoAI a produccion sin omisiones obvias.

## 1. Calidad base del repo

- `pnpm install --frozen-lockfile`
- `pnpm --filter @educai/database db:generate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## 2. Infraestructura y deploy

- GitHub Actions con secrets del environment `production` cargados
- Hooks de deploy configurados segun [`docs/DEPLOY.md`](./DEPLOY.md)
- Servicios productivos creados en Vercel y Render
- `DATABASE_URL` y `REDIS_URL` apuntando a recursos productivos, no locales
- `SENTRY_DSN` configurado en apps publicas y servicios backend
- `POSTHOG_KEY` configurado donde corresponda

## 3. Supabase compartido

- Confirmar `SUPABASE_URL` del proyecto correcto
- Confirmar que las keys cargadas pertenecen a EducAI
- No modificar configuracion, storage, auth ni tenants de IncluAI
- Validar aislamiento por `tenantId` antes de cualquier seed, migration o alta manual

## 4. Auth y contexto de tenant

- Revisar [`docs/AUTH_READINESS.md`](./AUTH_READINESS.md)
- Confirmar que no quedan headers o bodies provisorios para identidad sensible
- Confirmar que el tenant derive de sesion o token, no de input arbitrario
- Confirmar proteccion de rutas y RBAC antes de abrir usuarios reales

## 5. Tutor IA y safety

- Ejecutar y aprobar los 10 escenarios de [`docs/claude/tutor-test-scenarios.md`](./claude/tutor-test-scenarios.md)
- Tratar el escenario 5 de crisis como bloqueante absoluto de release
- Verificar que jailbreaks fuertes no desplacen el rol pedagogico
- Validar que el tutor no entregue respuestas directas en escenarios academicos
- Confirmar handoff humano y alertas backend para crisis

## 6. Operacion funcional minima

- `apps/api` responde `GET /health`
- `apps/worker` responde `GET /health`
- `apps/web` builda y sirve rutas estaticas sin errores
- `apps/gov-dashboard` builda y tiene tenant publico correcto
- `apps/whatsapp-agent` tiene webhook y credenciales Twilio validas
- `apps/whatsapp-agent` valida firma Twilio con URL publica correcta

## 7. Compliance y revision humana

- Revision pedagogica humana previa a release publico
- Si hay flujos de salud mental o crisis, revision de especialistas antes del launch
- Revisar textos legales, privacidad y seguridad visibles al usuario

## 8. Cierre

- Confirmar monitoreo activo en produccion
- Confirmar rollback path por servicio
- Etiquetar release o dejar commit SHA de referencia
