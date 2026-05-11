# @educai/gov-dashboard

Dashboard institucional de EducAI Gov. Next.js 14 + `@educai/ui`.

## Estado actual

- expone un tablero estatico de demostracion con KPIs y lectura territorial resumida;
- no tiene auth real ni datos en vivo conectados;
- sirve como base visual para el panel ministerial o jurisdiccional.

## Arranque local

```bash
pnpm --filter @educai/gov-dashboard dev
```

`http://localhost:3100` sirve el panel.

## Notas operativas

- El script `typecheck` usa `next build` por la misma dependencia de `typedRoutes`.
- La integracion real con tenant ministerial, permisos y auditoria sigue pendiente.
