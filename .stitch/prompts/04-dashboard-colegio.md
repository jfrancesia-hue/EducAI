# Prompt Stitch — 04. Dashboard colegio EducAI (B2B)

**Device:** DESKTOP
**Intent:** directivo/coordinador pedagógico entra cada mañana. Quiere ver rápido estado del colegio, docentes que necesitan apoyo, planificaciones pendientes, alertas de deserción. Debe sentir rigor profesional, no sólo "linda UI".

---

## Pegar este prompt en Stitch

```
Generá el dashboard web del administrador del colegio en EducAI (producto B2B institucional del ecosistema EducAI LATAM). Es el home del director/coordinador después de login en schools.educai.com. Next.js 14 App Router + Tailwind + shadcn/ui + Recharts/Tremor.

**VIBE**
Institucional pero moderno. Serio, denso, confiable, data-first. Debe sentirse como Linear + Notion for Education + Tremor dashboards. Evitar cualquier estética "edtech infantil"; acá el usuario es un profesional pedagógico tomando decisiones. Tono neutro argentino, "ustedes" evitar, preferir impersonal o "vos" directo.

**DESIGN SYSTEM (REQUIRED)**
- Platform: Web Desktop, sidebar 260px + main.
- Palette EducAI institucional:
  - Brand Primary: #1E40AF (blue-700)
  - Accent: #0D9488 (teal-600) para progreso
  - Deep header: #0F172A (slate-900)
  - Soft BG: #EFF6FF (blue-50)
  - Semantic: emerald #10B981 success, amber #F59E0B atención, rose #E11D48 urgente.
  - Neutrals slate.
- Typography: Inter Tight headings (peso 600-700), Inter body, tabular numbers.
- Radius: cards 14px (más cuadrado que ApoyoAI), buttons radius-md (10px).
- Shadows whisper-soft, bordes visibles neutral-200.
- Density: mayor que ApoyoAI, hueco moderado.

**LAYOUT — Shell admin institucional**

**Sidebar izquierdo (260px fijo, fondo slate-950):**
- Header del sidebar:
  - Logo EducAI + "Nativos Consultora" pequeño.
  - Selector de colegio: card con logo del colegio + nombre "Instituto San Francisco · Catamarca" + chevron para cambiar (si tenés múltiples sedes).
- Nav items agrupados con separators:
  - **Vista general**: 🏠 Panel, 📊 Indicadores clave
  - **Pedagógico**: 📚 Currículo, 📝 Planificaciones, 🎯 Competencias, 🧠 DocenteAI
  - **Comunidad**: 👩‍🏫 Docentes, 👦 Alumnos, 👨‍👩‍👧 Familias
  - **Riesgo**: ⚠️ Deserción temprana, 💛 Bienestar socioemocional
  - **Admin**: ⚙️ Configuración, 🔐 Permisos
- Texto nav items en slate-300, activo en white + bg blue-900 izquierda 3px border blue-500.
- Footer sidebar: avatar del director + nombre + rol "Director".

**Topbar (h-16, fondo white con borde bottom):**
- Breadcrumb "Inicio".
- Search global con atajo ⌘K (kbd visible).
- Badge plan "Plan EducAI · 420 alumnos activos" en blue-50.
- Bell notificaciones con dot rose si hay alertas.
- Avatar director con dropdown.

**MAIN AREA**

Título página:
- H1 "Buen día, Carolina" + subtitle "Esto es lo que está pasando hoy en Instituto San Francisco · Lunes 24 de abril".

**Row 1 — 5 KPI cards horizontales:**
- Cada card radius 14px, padding 20, shadow whisper, border neutral-200, fondo white.
- KPI 1: "Alumnos activos" número 420 + helper "+12 esta semana" en emerald + mini sparkline.
- KPI 2: "Docentes con planificaciones al día" 32/48 con progreso bar teal.
- KPI 3: "Planificaciones generadas por IA este mes" 156 + helper "ahorro ~96 horas docentes".
- KPI 4: "Alumnos en riesgo de deserción" 7 en rose + CTA pequeño "Ver detalle".
- KPI 5: "Uso DocenteAI últimos 7 días" 87% + sparkline.

**Row 2 — Grid 3 cols (col-span distribuido 2 + 1):**

**Card GRANDE izquierda (col-span-2) — "Desempeño por materia y grado"**:
- Header: H3 + filtros row: dropdown grado (1°-6° Primaria / 1°-6° Secundaria), dropdown trimestre, toggle "vs promedio provincial".
- Heatmap matricial: filas = grados, columnas = materias (Matemática, Lengua, Ciencias Nat, Ciencias Soc, Inglés, Ed. Física). Celdas coloreadas en escala teal→rose según performance. Cada celda muestra porcentaje pequeño. Hover tooltip detalle.
- Debajo del heatmap: leyenda + botón ghost "Exportar a PDF" + link "Comparar con benchmark OCDE".

**Card MEDIA derecha (col-span-1) — "Top acciones sugeridas"**:
- Header: H4 "Acciones sugeridas por la IA hoy" + badge "4 pendientes".
- Lista de 4 items con ícono circular colorido, chip categoría, título, CTA:
  - 🔴 "Urgente": "Revisar planificaciones de Matemática 4° que aún no subió el docente Pérez" + pill "Enviar recordatorio".
  - 🟡 "Recomendado": "Actualizar currículo de Educación Digital — está 3 años atrasado" + pill "Ver brechas".
  - 🟢 "Oportunidad": "Capacitación DocenteAI IA generativa — 8 docentes interesados" + pill "Abrir cupos".
  - 💙 "Bienestar": "3 alumnos con señales de estrés académico esta semana" + pill "Ver panel".
- Cada item clickable con hover bg neutral-50.

**Row 3 — Grid 2 cols:**

**Card IZQ — "Alumnos en riesgo de deserción"**:
- Header: H3 + badge rose "7 alumnos" + filtros dropdown (nivel, grado, factor).
- Tabla densa (data table):
  - Columnas: Alumno (avatar + nombre + grado), Score riesgo (0-100, badge rose si >70), Factores (chips: "Ausencias", "Bajón ánimo", "Bajas notas mat"), Última acción (fecha + dropdown), Docente tutor.
  - 5 filas visibles + paginación.
  - Fila hover subtle.
  - Checkbox para seleccionar múltiples + bulk action "Notificar tutores".
- Footer: link "Ver todos los alumnos monitoreados".

**Card DER — "Progreso DocenteAI"**:
- Header: H3 "Formación docente continua".
- Lista ranking de los 5 docentes con más microcursos completados esta semana.
- Cada row: posición (#1 medalla), avatar + nombre + materia, barra de progreso teal + horas.
- Debajo: card llamativa "Propuesta de capacitación para abril: IA generativa en el aula" con CTA pill teal "Lanzar capacitación" + subtítulo "28 docentes sugeridos por el motor".

**Row 4 — Card wide "Indicadores ministeriales"**:
- Banner amber soft "Tu colegio es parte del piloto provincial — estos indicadores se reportan automáticamente al ministerio":
- 4 mini-cards horizontales con indicadores formales:
  - "Cobertura curricular": 87%
  - "Reducción deserción vs año anterior": -14%
  - "Brechas curriculares vs marco OCDE": 12 gaps identificadas · 5 cerradas
  - "Satisfacción familiar (encuesta)": 4.3 / 5
- CTA ghost "Ver informe completo para el ministerio".

**Row 5 — Footer de página — 2 columnas:**

**Card IZQ — "Actividad reciente" (event log)**:
- Lista tipo timeline con íconos:
  - "Lucía P. subió planificación 5° Matemática — Fracciones" hace 12min.
  - "DocenteAI sugirió capacitación para 8 docentes" hace 1h.
  - "Alumno nuevo: Martín R., 3° Primaria" hace 3h.
  - "Reporte mensual enviado al Ministerio de Catamarca" ayer.
- Link "Ver historial completo".

**Card DER — "Próximas fechas"**:
- Lista:
  - "Entrega trimestral de planificaciones" — 5 días.
  - "Capacitación IA generativa" — 12 días.
  - "Reporte al ministerio abril" — 20 días.
  - "Fin de trimestre" — 35 días.
- CTA ghost "Ver calendario institucional".

**INTERACCIONES**
- Sidebar colapsa a iconos si la ventana es <1200px.
- Hover en tabla con fila highlight y botón de acción inline aparece.
- Filtros con chips eliminables y animación al quitar.
- Export to PDF con spinner y toast de confirmación.
- Notifications con slide-in desde top-right.

**ACCESIBILIDAD**
- Heatmap con texto descriptivo en cada celda (aria-label con valor exacto).
- Atajos de teclado documentados en menú ayuda (⌘K search, G+P panel, G+A alumnos, etc).
- Alto contraste opcional toggle en profile dropdown.
- Lectura de pantalla completa funcional.

**RESPONSIVE**
Mobile: sidebar off-canvas, KPIs se apilan vertical en 2 columnas, heatmap scroll horizontal.
```

---

## Post-generación

1. HTML → `.stitch/designs/04-dashboard-colegio.html`
2. Screenshot → `.stitch/designs/04-dashboard-colegio.png`
3. Componentes a mapear: Sidebar admin (custom), DataTable, Heatmap (recharts custom), Card, Tabs, Badge, Button, Progress, Alert, Dropdown, Command (⌘K search).
