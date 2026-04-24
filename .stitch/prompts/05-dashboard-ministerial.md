# Prompt Stitch — 05. Dashboard ministerial (EducAI B2G)

**Device:** DESKTOP (big screen, hasta 1920px)
**Intent:** ministro/secretario educativo entra 1-2 veces por semana. Necesita ver la provincia completa, comparar zonas, detectar problemas, justificar decisiones con datos abiertos. Serio, muy formal, inspira confianza.

---

## Pegar este prompt en Stitch

```
Generá el dashboard ministerial de EducAI Gov — el módulo B2G del ecosistema EducAI LATAM. Usuarios: ministro, secretarios, directores de área de ministerios provinciales/nacionales. Next.js 14 App Router + Tailwind + shadcn/ui + Tremor para charts.

**VIBE**
Institucional serio, rigor académico, transparencia pública. Inspiración: Bloomberg Terminal simplificado + data.gov + Observable + Tremor dashboards. Nada de colores chillones, nada de gamificación. Que un secretario de educación de 60 años lo use con comodidad en una pantalla de sala de reuniones.

**DESIGN SYSTEM (REQUIRED)**
- Platform: Web Desktop, optimizado para pantallas grandes. Sidebar 280px.
- Palette ministerial (restrained):
  - Primary: #0F172A (slate-900) headers institucionales
  - Brand Blue: #1E40AF (blue-700)
  - Accent Trust: #0D9488 (teal-600) datos positivos
  - Data-viz categórica (Tremor compatible): #1E40AF, #0D9488, #F59E0B, #E11D48, #8B5CF6, #64748B
  - Neutrals: slate completo, mucho gris.
- Typography: Inter Tight headings (peso 700), Inter body, tabular nums obligatorio en tablas y dashboards.
- Radius: 10px cards (más cuadrado aún), 8px buttons.
- Shadows mínimas, preferir bordes visibles neutral-200/300.
- Density: alta, información densa pero legible, padding conservador.
- Canvas white puro, sidebar slate-950 profundo.

**HEADER TOP (h-20) fondo slate-950:**
- Logo EducAI Gov + "Ministerio de Educación · Provincia de Catamarca" en slate-200.
- Center: breadcrumb "Panel ministerial · Provincial · Abril 2026".
- Right: badge "Datos al 23 de abril 2026" + ícono download (exportar todo) + ícono shield (audit log) + avatar ministro.

**SIDEBAR (fondo slate-950, 280px):**
- Sección "Vista general":
  - 🗺️ Mapa provincial
  - 📊 Indicadores clave
  - 🎯 Objetivos provinciales
- Sección "Alumnos":
  - 👦 Matrícula total
  - ⚠️ Deserción temprana
  - 🏫 Cobertura escolar
- Sección "Docentes":
  - 👩‍🏫 Docentes activos
  - 📚 Formación continua
- Sección "Currículo":
  - 📝 Planificaciones
  - 🌐 Brechas OCDE/UNESCO
  - 🧬 Competencias clave
- Sección "Calidad":
  - 📈 Desempeño por zona
  - 💛 Bienestar socioemocional
  - 🎓 Egresados y empleabilidad
- Sección "Transparencia":
  - 🌍 Datos abiertos públicos
  - 📋 Auditoría de accesos
  - 📤 Reportes firmados

Items selected bg blue-900, texto white, borde izq 3px blue-500.

**MAIN AREA**

**Header de página:**
- H1 "Panel Provincial · Catamarca"
- Subtitle slate-600 "Última sincronización: hace 12 minutos · Fuente: 842 colegios · 187.432 alumnos · 12.854 docentes"
- Row de tags filtro activos: "Q1 2026 · Todos los niveles · Todas las zonas · Datos oficiales + EducAI"

**Row 1 — 6 KPI cards pequeños (grid-cols-6, más densos que los B2B):**
- Cada card radius 10, padding 16, border neutral-200, bg white.
- Cada KPI: label caption gris uppercase pequeño, número grande (tabular), helper con ±% vs período anterior (emerald/rose), mini-sparkline opcional.
- KPIs: "Matrícula total" 187.432, "Tasa de deserción" 8.4% (rose ↓0.6pp), "Cobertura curricular" 81% (emerald ↑3pp), "Docentes formados en IA" 2.134, "Colegios en EducAI" 842/1.204, "Brechas OCDE cerradas" 127.

**Row 2 — Layout 2/3 + 1/3:**

**Card GRANDE izquierda (col-span-2) — "Deserción temprana por departamento"**:
- Header: H3 + filtros (Nivel: Primaria/Secundaria, Período: trimestre/anual, Comparar vs objetivo).
- **Mapa SVG estilizado de la provincia de Catamarca** dividido por departamentos. Cada departamento coloreado según score de deserción (escala slate→teal→rose). Hover tooltip con: nombre, tasa, total alumnos, acción sugerida.
- Leyenda compacta a la derecha: escala con rangos % y botones toggle para capas (añadir "Bienestar", "Cobertura curricular", "Uso EducAI").
- Abajo del mapa: tabla ranking con top 5 departamentos de mayor riesgo y top 5 de mejora.

**Card derecha (col-span-1) — "Alertas accionables"**:
- Header: H4 "Alertas que requieren decisión".
- Lista de 4 items con ícono + severidad + título + métrica + CTA ghost:
  - 🔴 "Crítico": "El Alto — deserción subió 4pp en 2 meses" · "Ver planes sugeridos"
  - 🟡 "Medio": "12 colegios sin planificación actualizada desde 2024" · "Generar notificación"
  - 🟢 "Oportunidad": "Valle Viejo lidera adopción de DocenteAI — 89%" · "Replicar programa"
  - 💙 "Bienestar": "3 colegios con aumento de reportes socioemocionales" · "Activar protocolo"
- Footer: "Ver el plan completo propuesto por EducAI →".

**Row 3 — 3 charts Tremor en grid-cols-3:**

**Chart 1 — "Tendencia de indicadores clave (12 meses)"**:
- Multi-line chart Tremor.
- Líneas: Matrícula total, Tasa deserción (dual eje), Cobertura curricular, Uso EducAI.
- Leyenda abajo, tooltips con formato numérico.

**Chart 2 — "Desempeño por competencia vs benchmark"**:
- Radar chart.
- Ejes: Comprensión lectora, Razonamiento matemático, Pensamiento crítico, Competencias digitales, Educación financiera, Ciudadanía digital.
- 2 líneas: "Catamarca" (teal) vs "Promedio provincial de referencia" (slate).

**Chart 3 — "Distribución de presupuesto vs impacto"**:
- Scatter plot con bubble size = inversión.
- X = gasto por alumno USD, Y = puntaje calidad pedagógica.
- Cada burbuja = un departamento. Burbuja destacada para outliers.

**Row 4 — Card wide "Matriz de colegios priorizados por intervención":**
- Header: H3 "Colegios priorizados para intervención en Q2 2026" + filtros.
- Data table muy densa:
  - Columnas: Colegio (nombre + dept), Tipo (público/privado), Alumnos, Score riesgo (0-100, badge color), Brechas críticas (chips), Última visita supervisor, Acción propuesta por IA (pill), Aprobación (botón pill "Aprobar / Revisar").
  - 8-10 filas + paginación al pie.
  - Filtro chips arriba: Nivel, Departamento, Tipo, Score mínimo.
  - Bulk action: checkbox seleccionar múltiples + botón "Asignar plan de intervención".
- Export: "Exportar selección (CSV / PDF firmado)".

**Row 5 — Franja transparencia datos abiertos (full-width):**
- Fondo slate-900 invertido, padding 32.
- H3 white "Datos públicos del sistema educativo provincial" + subtitle slate-300 "Comprometidos con la transparencia: los indicadores clave son públicos y auditables".
- 3 botones pill ghost outline white: "Descargar datos abiertos (CSV)", "Ver API pública", "Ver metodología".
- Footer micro: "Última auditoría externa: 15 marzo 2026 · Universidad Nacional de Catamarca".

**Row 6 — Card "Firmas y compliance"**:
- Tabla de reportes firmados digitalmente.
- Columnas: Reporte, Firmado por, Fecha, Hash (shortened + copy), Estado (badge emerald "Vigente"), Acción "Ver".
- Row items densos, tipo registro oficial.

**Row 7 — Footer institucional:**
- Logos grises: Ministerio de Educación · Gobierno de Catamarca · EducAI · Nativos Consultora.
- Copy micro: "Versión 2.4.1 · Datos encriptados AES-256 · Cumplimiento Ley 26.061 · Auditoría SOC 2".
- Links: "Términos", "Privacidad", "Auditoría externa", "Contacto técnico".

**INTERACCIONES**
- Todos los números con tooltip explicativo de cómo se calculan.
- Filtros como chips con animación salida.
- Cada chart con botón "ver detalle" que abre modal full-screen con data table debajo.
- Export PDF firmado lanza modal de confirmación con vista previa.
- Cambios de filtro animan transiciones de datos (~300ms ease).

**ACCESIBILIDAD**
- Charts con fallback table (toggle "ver como tabla" junto a cada chart).
- Alto contraste opcional siempre disponible.
- Anuncio de cambio de datos con aria-live polite.
- Keyboard navigable 100%.
- Documentado atajos de teclado.

**IMPRESIÓN / EXPORT**
- CSS print mode para exportar cualquier sección como PDF con header oficial + logo + pie con fecha + firma + hash.
- Diseño que se imprima bien en A4 vertical.
```

---

## Post-generación

1. HTML → `.stitch/designs/05-dashboard-ministerial.html`
2. Screenshot → `.stitch/designs/05-dashboard-ministerial.png`
3. Componentes a mapear: Sidebar gov (custom), KPICard compacto, MapSVG (custom), Tremor charts (LineChart, AreaChart, BarChart, DonutChart, ScatterChart), DataTable densa, Command ⌘K, Alert, Badge, Button.
4. Considerar theme ministerial oscuro separado para modo "sala de reuniones / proyección".
