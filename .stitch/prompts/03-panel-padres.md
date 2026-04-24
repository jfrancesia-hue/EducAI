# Prompt Stitch — 03. Panel web de padres (ApoyoAI)

**Device:** DESKTOP (responsive)
**Intent:** el padre entra 1-2 veces por semana a ver cómo va su hijo. Tiene que sentir control + tranquilidad en 30 segundos. El principal entregable es el reporte semanal con tono constructivo, NO punitivo.

---

## Pegar este prompt en Stitch

```
Generá el dashboard web de padres de ApoyoAI (tutor IA por WhatsApp). Es el home al que entran los padres cuando abren app.apoyoai.com después de login. Next.js 14 App Router + Tailwind + shadcn/ui + Recharts.

**VIBE**
Hogareño y tranquilizador pero data-informed. Inspiración: Duolingo app (progreso cálido), Notion (claridad de jerarquía), Linear (densidad sin ruido). Debe transmitir "mi hijo está en buenas manos y está progresando" en un vistazo.

**DESIGN SYSTEM (REQUIRED)**
- Platform: Web Desktop, sidebar fijo 240px + main área flexible.
- Palette ApoyoAI: indigo #4F46E5 primario, amber #F59E0B acento, emerald #10B981 para progreso positivo, rose #FB7185 para alertas suaves, slate neutrals.
- Typography: Inter Tight headings, Inter body, tabular numbers para datos.
- Radius cards: 20px. Buttons pill.
- Shadows soft en cards (0 4px 12px rgba(15,23,42,0.06)).
- Background main: #F8FAFC muy suave.

**LAYOUT — Shell de 3 zonas**

**Sidebar izquierdo fijo (240px):**
- Logo ApoyoAI arriba.
- Nav items con icono + label:
  - 🏠 Panel (activo)
  - 👦 Mis hijos
  - 📊 Progreso
  - 📝 Reportes semanales
  - 💬 Conversaciones
  - 💳 Suscripción
  - ⚙️ Configuración
- Item activo: bg indigo-50, text indigo-700, borde izquierdo 3px indigo.
- Abajo del nav: card pequeña "Plan Premium" + botón ghost "Gestionar".
- Avatar del padre abajo con dropdown (salir, ayuda, idioma).

**Topbar (h-16):**
- Breadcrumb "Panel · Juan".
- A la derecha: search icon, notificaciones bell con dot amber si hay, avatar.
- Selector de hijo/a: pill con avatar pequeño + nombre + dropdown si hay múltiples hijos ("Juan ▼").

**Main area (flex-1, max-w-7xl, padding 32):**

Título de página:
- H1 "Hola María, Juan tuvo una semana linda 💛"
- Subtitle gris "Semana del 14 al 20 de abril · Actualizado hace 2 horas"

**Fila 1 — 4 KPIs horizontales (grid-cols-4):**
- Cada KPI card radius 20px, padding 24, shadow soft, fondo blanco.
- Card 1 "Tiempo esta semana": número grande "2h 40min" + mini-sparkline emerald abajo + helper "+ 15% vs semana anterior" en emerald.
- Card 2 "Conversaciones": "18" + helper "Matemática, Lengua, Ciencias".
- Card 3 "Logros desbloqueados": "3 🏆" + helper "Ver todos" link indigo.
- Card 4 "Ánimo promedio": emoji grande 😊 + helper "Estable · 4 de 5".

**Fila 2 — 2 columnas (grid-cols-3, col-span-2 y col-span-1):**

**Card grande IZQUIERDA (col-span-2) — "Progreso por materia"**
- Header: H3 + tabs horizontales "Esta semana · Mes · Trimestre".
- Chart: horizontal bar chart estilizado, una barra por materia (Matemática, Lengua, Ciencias, Inglés).
- Cada barra: label + barra indigo con progreso + porcentaje + badge pequeño de competencia fuerte (ej: "Comprensión · Avanzado" emerald chip).
- Click en barra muestra detalle abajo.
- Footer de la card: link pill "Ver análisis completo →".

**Card MEDIA DERECHA (col-span-1) — "Alertas amables"**
- Header: H4 "Cosas que te conviene saber".
- Lista de 3 items con ícono circular colorido, título + descripción micro:
  - 💛 amber: "Se frustró el martes con fracciones. Ya lo superó, pero te aviso."
  - 💜 indigo: "Juan te preguntó si podés darle un beso antes de dormir. El tutor me lo contó."
  - 🌱 emerald: "Consolidó bien los tiempos verbales. Buen momento para una charla de ese tema."
- Cada alerta con CTA sutil "Cómo acompañar" o "Ver detalle".
- Al final: footer micro "El tutor nunca comparte conversaciones privadas. Sólo señales relevantes." en gris.

**Fila 3 — Card wide "Reporte semanal" full-width:**
- Card fondo gradient suave indigo-50 → amber-50, radius 20px, padding 40.
- Izquierda: ilustración pequeña "carta" abierta o regalo (amber).
- Derecha: H3 "Tu reporte semanal está listo" + subtexto "Un resumen en 3 minutos, con cómo acompañarlo esta semana" + 2 CTAs: pill indigo "Leer reporte" + ghost "Recibir por email también".

**Fila 4 — 2 cards (grid-cols-2):**

**Card IZQ — "Conversaciones recientes":**
- H4 "Últimas conversaciones del tutor con Juan".
- Lista de 4 items:
  - Avatar materia (círculo con ícono) + título ("Matemática · Fracciones"), preview 1 línea del resumen, timestamp, badge status (emerald "Entendió", amber "A revisar").
- Card item hover bg neutral-50, clickable.
- Footer: "Ver todas →" link.

**Card DER — "Próximo objetivo":**
- H4 "Lo que viene" + descripción "Propuesto por el tutor y revisable por vos".
- Mini checklist con 3 items:
  - ☐ "Repasar fracciones con denominadores distintos antes del viernes"
  - ☐ "Terminar 2 ejercicios de comprensión lectora"
  - ☐ "Probar 15 min de modo examen simulado"
- Botón secundario "Editar objetivos" al pie.

**Fila 5 — Franja clara de confianza (full-width):**
- Fondo neutral-100, padding 32, radius 20.
- Ícono shield indigo + title "Tu hijo está seguro" + 3 pastillas horizontales:
  - "Nunca ve contenido inapropiado"
  - "Crisis detectadas derivan a vos y a profesionales"
  - "Datos encriptados bajo Ley 26.061"
- Link discreto "Política de privacidad de menores".

**ESTADOS VACÍOS**
Si es la primera semana (sin data todavía):
- KPIs muestran "—" con helper "Esperando primeras conversaciones".
- Reporte semanal card muestra "Tu primer reporte llega el domingo" con countdown mini.
- Conversaciones card muestra ilustración suave "Todavía no hay conversaciones. Mandale un 👋 desde WhatsApp: +54 9 ..." con CTA pill verde WhatsApp.

**MICRO-INTERACCIONES**
- Cards con hover: eleva 2px + sombra intensifica.
- Sparklines con entrada animada path-draw.
- Badges de logros con shimmer amber sutil.
- Tabs con underline animado que sigue al activo.

**ACCESIBILIDAD**
- Sidebar navegable con teclado (tab + arrows).
- Focus ring visible en todos interactivos.
- Datos numéricos con aria-label explícito.
- Alertas con role=status.
```

---

## Post-generación

1. HTML → `.stitch/designs/03-panel-padres.html`
2. Screenshot → `.stitch/designs/03-panel-padres.png`
3. Componentes a mapear en implementación: Sidebar (custom), Card, Tabs, Badge, Button, Avatar, Progress, Chart Recharts.
