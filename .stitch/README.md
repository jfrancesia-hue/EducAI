# .stitch — Sistema de diseño y prompts de Stitch

Carpeta que contiene el sistema de diseño (`DESIGN.md`), los prompts de cada pantalla (`prompts/`) y las salidas de Stitch (`designs/`).

## Estructura

```
.stitch/
├── DESIGN.md                           # sistema de diseño (fuente de verdad)
├── prompts/                            # prompts listos para pegar en Stitch
│   ├── 01-landing-apoyoai.md
│   ├── 02-onboarding-padre.md
│   ├── 03-panel-padres.md
│   ├── 04-dashboard-colegio.md
│   └── 05-dashboard-ministerial.md
├── designs/                            # HTML + PNG generados por Stitch
│   └── (vacío hasta generar)
└── README.md                           # este archivo
```

## Cómo usarlo

### Opción A — Stitch web (recomendada ahora)

1. Entrá a https://stitch.withgoogle.com/ y creá (o abrí) un proyecto llamado **EducAI LATAM**.
2. Copiá el contenido completo de `DESIGN.md` y pegalo como system prompt / contexto del proyecto (si Stitch lo permite) — si no, pegalo al inicio de cada prompt de pantalla.
3. Para cada pantalla: abrí el archivo `.stitch/prompts/0X-*.md`, copiá el bloque de código (desde "Generá..." hasta el último `}` o la última instrucción de accesibilidad) y pegalo en el generador de Stitch.
4. Configurá el dispositivo según indica el header del prompt (DESKTOP o MOBILE).
5. Al terminar la generación:
   - Descargá el HTML a `.stitch/designs/0X-nombre.html`.
   - Descargá el screenshot a `.stitch/designs/0X-nombre.png`.
6. Si algo no quedó, usá `edit_screens` con prompt de ajuste puntual (no regeneres desde cero salvo que el layout esté fundamentalmente mal).

### Opción B — Stitch MCP (si se conecta)

Si se conecta el MCP server de Stitch a Claude Code (`mcp__StitchMCP__*` tools disponibles), el skill `stitch-design` puede automatizar:
- `list_projects` / `create_project` con "EducAI LATAM"
- `generate_screen_from_text` pegando cada prompt
- Download automático a `.stitch/designs/`

## Orden sugerido de generación

1. **01-landing-apoyoai** — para validar la identidad consumer y tono de copy primero.
2. **02-onboarding-padre** — flujo crítico de conversión.
3. **03-panel-padres** — el dashboard más visto por usuarios B2C.
4. **04-dashboard-colegio** — arranca la identidad B2B institucional.
5. **05-dashboard-ministerial** — la más formal, última porque reusa patrones de 04.

## Antes de pasar a código (Fase 0)

Antes de ejecutar la Fase 0 del setup del monorepo, asegurarse de:

- [ ] Las 5 pantallas generadas y aprobadas visualmente.
- [ ] Revisión de contraste WCAG AA manual (usar https://webaim.org/resources/contrastchecker/).
- [ ] Validar tokens de color y tipografía contra `DESIGN.md`.
- [ ] Decidir si vamos con Next.js 14 (como indica el paquete maestro) o Next.js 16 (alineado con otros proyectos del usuario — preferencia registrada).
- [ ] Confirmar que los componentes marcados en cada prompt existen en shadcn/ui (Accordion, Tabs, DataTable, Command, etc.).

## Tokens de diseño clave (resumen)

- **ApoyoAI primary:** `#4F46E5` indigo / accent `#F59E0B` amber / warm `#FB7185` coral
- **EducAI primary:** `#1E40AF` blue / accent `#0D9488` teal / deep `#0F172A` slate
- **Type:** Inter Tight headings, Inter body, JetBrains Mono en code
- **Radius:** 20px (ApoyoAI cards) / 14px (EducAI cards) / pill buttons (ApoyoAI)
- **Shadow base:** `0 4px 12px rgba(15,23,42,0.06)`

Ver `DESIGN.md` para el detalle completo.
