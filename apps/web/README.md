# @educai/web

Frontend principal de EducAI. Next.js 14 App Router + Tailwind + `@educai/ui`.

## Estado actual

- `/` expone la landing publica.
- `/colegios`, `/contacto`, `/privacidad` y `/seguridad` cubren la superficie institucional.
- `/login` autentica contra Supabase Auth.
- `/app/*` queda protegido por middleware y sesion SSR.
- expone manifest + service worker para instalarse como webapp en celular y escritorio.
- aun no hay RBAC ni claims de tenant conectados en la UI.

## Arranque local

```bash
pnpm --filter @educai/web dev
```

`http://localhost:3000` sirve el portal.

## Instalacion como app

- En Android/Chrome: abrir el sitio y usar `Instalar app` o `Agregar a pantalla de inicio`.
- En iPhone/iPad: abrir en Safari y usar `Compartir -> Agregar a pantalla de inicio`.

## Notas operativas

- La sesion web depende de `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Las rutas `/app/*` redirigen a `/login` cuando no existe una sesion valida.
- El script `typecheck` usa `next build` porque `typedRoutes` depende de tipos generados por Next.
