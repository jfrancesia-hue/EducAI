# @educai/ui

Componentes React compartidos del ecosistema EducAI (basados en shadcn/ui) y preset de Tailwind alineado con `.stitch/DESIGN.md`.

## Instalación (ya viene via workspace)

En una app (apps/web, apps/gov-dashboard):

```json
{
  "dependencies": {
    "@educai/ui": "workspace:*"
  }
}
```

## Tailwind preset

```js
// tailwind.config.js
module.exports = {
  presets: [require("@educai/ui/tailwind-preset")],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};
```

Y en el `globals.css` de la app:

```css
@import "@educai/ui/styles/globals.css";
```

## Switchear identidad ApoyoAI ↔ EducAI

Aplicar atributo en el `<html>` (o en el layout raíz):

```tsx
<html lang="es-AR" data-brand="apoyoai">  // B2C calido (default)
<html lang="es-AR" data-brand="educai">   // B2B/B2G institucional
```

Cambia tokens `--primary`, `--accent`, `--ring` automáticamente.

## Componentes disponibles

| Componente | Import |
|---|---|
| Button (con variants, sizes, `pill`) | `import { Button } from "@educai/ui"` |
| Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter | `import { Card } from "@educai/ui"` |
| Input | `import { Input } from "@educai/ui"` |
| Label | `import { Label } from "@educai/ui"` |
| Badge | `import { Badge } from "@educai/ui"` |
| `cn()` utility | `import { cn } from "@educai/ui"` |

Componentes adicionales se van agregando on-demand durante Fase 1+ (Accordion, Tabs, Dialog, DataTable, Tremor wrappers).
