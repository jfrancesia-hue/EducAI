# @educai/gov-dashboard

Dashboard institucional de EducAI Gov. Next.js 14 + `@educai/ui`.

## Estado actual

- expone un tablero institucional protegido por sesion Supabase Auth;
- consume handoffs reales del API y permite cerrarlos desde el panel;
- sirve como base visual para el panel ministerial o jurisdiccional.

## Arranque local

```bash
pnpm --filter @educai/gov-dashboard dev
```

`http://localhost:3100` sirve el panel.

## Notas operativas

- `/` queda protegido por middleware y redirige a `/login` sin sesion valida.
- `/login` autentica contra Supabase Auth y `/login/salir` cierra la sesion.
- requiere `NEXT_PUBLIC_API_URL` para consultar y cerrar handoffs.
- El script `typecheck` usa `next build` por la misma dependencia de `typedRoutes`.
- La integracion real con tenant ministerial, permisos y auditoria sigue pendiente.
