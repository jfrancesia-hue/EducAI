# @educai/web

Frontend principal de EducAI. Next.js 14 App Router + Tailwind + `@educai/ui`.

## Estado actual

- `/` expone la landing publica.
- `/colegios`, `/contacto`, `/privacidad` y `/seguridad` cubren la superficie institucional.
- `/login` abre un acceso demo local.
- `/app/*` contiene la experiencia interna demo para docentes con middleware y cookie de sesion.
- aun no hay proveedor de identidad real ni RBAC conectado.

## Arranque local

```bash
pnpm --filter @educai/web dev
```

`http://localhost:3000` sirve el portal.

## Notas operativas

- El acceso demo crea una cookie local `educai_demo_session`.
- Las rutas `/app/*` redirigen a `/login` cuando no existe esa sesion.
- El script `typecheck` usa `next build` porque `typedRoutes` depende de tipos generados por Next.
