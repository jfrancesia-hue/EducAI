# @educai/gov-dashboard

Dashboard ministerial de EducAI Gov (B2G). Next.js 14 + Tremor.

Stub en Fase 0 con 6 KPIs institucionales y 2 placeholders (mapa de deserción + alertas
accionables). Fase 4 implementa los módulos completos.

## Arranque local

```bash
pnpm --filter @educai/gov-dashboard dev
```

`http://localhost:3100` sirve el panel.

## Tenant ministerial

El dashboard se sirve bajo `NEXT_PUBLIC_TENANT=ministerio-catamarca` (o el que corresponda en la
licencia). Cada ministerio tiene un tenant `MINISTRY` en la DB y sus permisos se modelan con
`Role` + `RolePermission` (ver `packages/database/prisma/schema.prisma`).

## Seguridad

- SSO via Supabase Auth con MFA obligatorio para roles `MINISTRY` y `SCHOOL_ADMIN`.
- Auditoría de acceso: cada query queda registrada en `AuditLog`.
- Firma digital de reportes exportados (Fase 4).
