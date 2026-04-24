# EducAI LATAM — Design System (Source of Truth)

> Sistema de diseño unificado para las dos identidades del ecosistema: **ApoyoAI** (consumer, cálido) y **EducAI** (institucional, confiable). Pegar como contexto antes de cada generación en Stitch.

**Empresa:** Nativos Consultora Digital
**Tagline:** "El sistema operativo de la escuela moderna."
**Idioma:** Español AR (default). UI WCAG 2.1 AA. Multi-idioma con texto extraído.

---

## 1. Dos identidades, un sistema

EducAI LATAM tiene dos caras públicas que comparten tokens pero con paleta y temperatura distinta:

| Aspecto | ApoyoAI (B2C padres/alumnos) | EducAI (B2B/B2G colegios/gov) |
|---|---|---|
| Vibe | Cálido, esperanzador, humano, aspiracional | Serio, confiable, profesional, data-driven |
| Sensación | "mi hijo va a aprender mejor" | "tenemos los datos para decidir" |
| Radios | Muy redondeados (16px, 24px, pill) | Moderados (8px, 12px) |
| Sombras | Floating, suaves multicapa | Whisper-soft, contenidas |
| Tipo | Más humano, tight tracking | Más neutro, métrico |
| Animación | Bouncy, cálida, orgánica | Lineal, precisa |
| Fotografía | Chicos + padres reales LATAM, luz dorada | Docentes + aulas reales, iluminación natural |

---

## 2. Paleta de color

### Shared / Neutrals (Slate base — Tailwind slate)

| Token | Hex | Uso |
|---|---|---|
| `neutral-950` | #020617 | Texto display sobre claro |
| `neutral-900` | #0F172A | Texto principal |
| `neutral-700` | #334155 | Texto secundario |
| `neutral-500` | #64748B | Texto muted, placeholders |
| `neutral-300` | #CBD5E1 | Bordes, dividers |
| `neutral-100` | #F1F5F9 | Superficies elevadas suaves |
| `neutral-50` | #F8FAFC | Canvas, fondos |
| `white` | #FFFFFF | Cards |

### ApoyoAI palette (cálida)

| Token | Hex | Uso |
|---|---|---|
| `brand-primary` | #4F46E5 | Indigo — CTA principal, links, foco |
| `brand-primary-hover` | #4338CA | Hover CTAs |
| `brand-secondary` | #F59E0B | Amber — acento cálido, achievements, highlight |
| `brand-warm` | #FB7185 | Coral — notificaciones positivas, gamificación |
| `brand-soft` | #EEF2FF | Indigo-50 — backgrounds de sección |

### EducAI palette (institucional)

| Token | Hex | Uso |
|---|---|---|
| `brand-primary` | #1E40AF | Blue-700 — CTA institucional, brand |
| `brand-primary-hover` | #1E3A8A | Hover |
| `brand-secondary` | #0D9488 | Teal-600 — datos positivos, progreso |
| `brand-deep` | #0F172A | Slate-900 — headers ministeriales |
| `brand-soft` | #EFF6FF | Blue-50 — section bg |

### Semantic (compartido)

| Token | Hex | Uso |
|---|---|---|
| `success` | #10B981 | Emerald-500 — logros, completado |
| `warning` | #F59E0B | Amber-500 — atención, preview |
| `danger` | #E11D48 | Rose-600 — crisis, errores críticos |
| `info` | #0EA5E9 | Sky-500 — tips, sugerencias |

### Data-viz (dashboards Tremor-compatible)

Usar la paleta Tremor predeterminada + añadir estos para LATAM:
`#1E40AF, #0D9488, #F59E0B, #EF4444, #8B5CF6, #10B981, #F97316, #EC4899`

---

## 3. Tipografía

- **Display / Headings:** `Inter Tight` (o Satoshi) — peso 600-800, tracking tight (-0.02em)
- **Body UI:** `Inter` — peso 400-500
- **Numeric / Dashboards:** `Inter` con `font-feature-settings: "tnum"` (tabular nums)
- **Monospace (código, IDs):** `JetBrains Mono`

Escala (rem, base 16):

| Token | Tamaño | Line-height | Uso |
|---|---|---|---|
| `display-xl` | 4.5rem (72px) | 1.05 | Hero landings |
| `display-lg` | 3.5rem (56px) | 1.1 | Hero secundarios |
| `h1` | 2.5rem (40px) | 1.15 | Page title |
| `h2` | 2rem (32px) | 1.2 | Section |
| `h3` | 1.5rem (24px) | 1.3 | Subsection |
| `h4` | 1.25rem (20px) | 1.4 | Card titles |
| `body-lg` | 1.125rem (18px) | 1.6 | Intro párrafos |
| `body` | 1rem (16px) | 1.55 | Default |
| `body-sm` | 0.875rem (14px) | 1.5 | UI, labels |
| `caption` | 0.75rem (12px) | 1.4 | Meta, tags |

---

## 4. Espaciado y layout

- Grid base: **4px** (Tailwind default). Escala preferida: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Contenedor principal: `max-w-7xl` (1280px) con padding lateral `px-6 md:px-10 lg:px-12`.
- Section vertical padding: `py-16 md:py-24 lg:py-32`.
- Gaps en grids: `gap-6 md:gap-8`.

---

## 5. Border-radius y superficies

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 6px | Chips, badges |
| `radius-md` | 10px | Inputs |
| `radius-lg` | 14px | Cards estándar |
| `radius-xl` | 20px | Hero cards, modales |
| `radius-2xl` | 28px | Illustrated feature cards (ApoyoAI) |
| `radius-full` | 9999px | Pill buttons, avatares |

ApoyoAI default card: `radius-xl` (20px). EducAI default card: `radius-lg` (14px).

---

## 6. Elevación (sombras)

- `shadow-whisper`: `0 1px 2px rgba(15,23,42,0.04), 0 1px 1px rgba(15,23,42,0.03)`
- `shadow-soft`: `0 4px 12px rgba(15,23,42,0.06), 0 2px 4px rgba(15,23,42,0.04)`
- `shadow-float`: `0 12px 32px rgba(15,23,42,0.08), 0 4px 8px rgba(15,23,42,0.05)`
- `shadow-glow-primary`: `0 0 0 6px rgba(79,70,229,0.12)` (focus ring ApoyoAI)
- `shadow-glow-trust`: `0 0 0 6px rgba(30,64,175,0.12)` (focus ring EducAI)

---

## 7. Componentes clave (shadcn/ui base)

- **Button**: primary (bg brand-primary, white text), secondary (bg neutral-100, text neutral-900), ghost, destructive, link.
  - Sizes: `sm` (h-9, px-4), `md` (h-11, px-5), `lg` (h-14, px-6 text-lg).
  - ApoyoAI → radius-full. EducAI → radius-md.
- **Input / Textarea**: label arriba, helper text abajo, focus ring glow, error state con danger.
- **Card**: header (título + descripción), content, footer con actions. Sombra `soft`, border `neutral-300`.
- **Badge**: neutral, brand, success, warning, danger. Chips con radius-full.
- **Tabs**: underline style (ApoyoAI) o pill style (EducAI).
- **Data Table**: sticky header, zebra opcional, filtros chips arriba, empty state ilustrado.
- **Chart (Tremor)**: colores data-viz arriba, tooltip con tokens, leyenda abajo.
- **Modal / Dialog**: overlay `rgba(15,23,42,0.55)`, card `radius-xl`, entrada spring-in.
- **Toast**: bottom-right, radius-lg, auto-dismiss 5s.
- **EmptyState**: ilustración + texto + CTA. Línea de copy cálida.

---

## 8. Iconografía

- **Set:** Lucide (shadcn default) — consistente, outline, 1.5px stroke.
- **Tamaños UI:** 16px (inline), 20px (buttons), 24px (nav), 32-40px (feature).
- **Feature icons:** icon + color-soft circular background (48-64px).

---

## 9. Ilustraciones y fotografía

- **ApoyoAI:** ilustraciones estilo "humanos de Blush/Humaaans" pero customizadas LATAM (piel, pelo, ropa). Fotografía documental de padres + chicos en escenas cotidianas (mesa del comedor, patio), luz dorada tarde.
- **EducAI:** fotografía docente/institucional (docentes dando clase, directivos reunidos, aulas reales LATAM). Evitar stock "gringo". Incluir pueblos originarios cuando haga sentido (NOA).
- Nunca usar imágenes con chicos menores identificables sin consentimiento explícito. Preferir ilustración o tomas desde atrás/ángulo no identificable.

---

## 10. Accesibilidad WCAG 2.1 AA (no opcional)

- Contraste mínimo 4.5:1 para texto body, 3:1 para display. Verificar combos con brand-primary sobre white y viceversa.
- Focus visible en todos los interactivos (ring `shadow-glow-*`).
- Tamaños de tap ≥ 44x44px (mobile).
- Soporte lector de pantalla con ARIA labels en todos los iconos sin texto.
- Modo alto contraste y ajuste de tamaño de fuente respetan `prefers-contrast` y `prefers-reduced-motion`.
- Soporte multiidioma desde día 1 (es-AR default).

---

## 11. Patrones específicos del proyecto

### WhatsApp-first (ApoyoAI)

- Mostrar siempre el canal WhatsApp con el logo oficial verde `#25D366` y copy de acción tipo "Seguí con el tutor por WhatsApp".
- Vista previa de mensajería (chat bubbles) en la landing y onboarding, con globo del tutor IA en indigo suave y del alumno en blanco con borde.

### Data-first (EducAI gov)

- Cada número debe tener contexto (vs mes anterior, vs objetivo, tendencia mini-sparkline).
- Evitar gráficos decorativos: sólo charts que aportan decisión.
- Tablas densas con paginación, filtros chips, export CSV/PDF.

### Seguridad visible

- Badge "Datos protegidos Ley 26.061" visible en footer de ApoyoAI.
- Onboarding incluye consentimiento parental explícito como paso obligatorio.
- Panel de padres incluye "Qué ve el tutor IA" (transparencia).

---

## 12. Tono de copy

### ApoyoAI (cálido, aspiracional)
- "Tu hijo puede, vos también." (hero tentativo)
- "Un tutor que acompaña, sin juzgar."
- "Primera semana gratis, sin ingresar tarjeta."
- Uso de vos argentino. Evitar "tú".

### EducAI (profesional, cercano)
- "El sistema operativo de la escuela moderna."
- "Decisiones con datos reales, no intuición."
- "Docentes mejor formados, alumnos más motivados."

### Ministerial (serio, medible)
- "Reducí la deserción escolar un 20% con detección temprana."
- "Datos abiertos. Decisiones transparentes."

---

## 13. Deliverables esperados de Stitch

Por cada pantalla:
1. **HTML generado** → `.stitch/designs/<slug>.html`
2. **Screenshot** → `.stitch/designs/<slug>.png`
3. **Nota de componentes** → anotar qué componentes shadcn/Tremor se reutilizan para implementación.

---

## 14. Próximos pasos

1. Pegar los prompts de `.stitch/prompts/01..05` uno por uno en Stitch (MCP o web app https://stitch.withgoogle.com/).
2. Descargar HTML + screenshot de cada pantalla a `.stitch/designs/`.
3. Revisar accesibilidad y contraste.
4. Aprobar diseños → recién entonces arrancar Fase 0 (monorepo scaffold).
