# Prompt Stitch — 02. Onboarding padre + perfil del alumno (ApoyoAI)

**Device:** DESKTOP (con vista mobile responsive)
**Intent:** completar el onboarding post-registro — vincular hijo/s, configurar WhatsApp, consentimiento parental, arrancar diagnóstico. Quiero que el padre sienta que es un proceso corto, seguro y que ya está pasando algo concreto (no un trámite).

---

## Pegar este prompt en Stitch

```
Generá un flujo de onboarding multi-step para ApoyoAI (tutor IA por WhatsApp para alumnos, pagado por padres). Es la pantalla a la que llega el padre después de registrarse con email. Next.js 14 App Router + Tailwind + shadcn/ui.

**VIBE**
Cálido, claramente "ya estás adentro", no burocrático. Debe transmitir que cada paso es corto (2 minutos máximo). Que sienta que el producto ya empezó a trabajar por él. Inspiración: onboarding de Linear, Superhuman, Notion — pero más cálido y con identidad argentina.

**DESIGN SYSTEM (REQUIRED)**
- Platform: Web Desktop-first
- Palette igual que Landing ApoyoAI: indigo #4F46E5 primario, amber #F59E0B acento, slate neutrals.
- Typography: Inter Tight headings, Inter body.
- Radius: cards 20px, inputs 10px, buttons pill.
- Shadows: soft en cards principales, focus glow indigo 6px translúcido.
- Layout: máx 720px de ancho centrado con sidebar izquierdo de steps.

**ESTRUCTURA GENERAL DE LA PANTALLA**

Layout a 2 columnas:

**Izquierda (320px fijo):** stepper vertical con progreso.
- Logo ApoyoAI arriba + texto "Configurá tu cuenta".
- Stepper vertical con 5 steps:
  1. Sobre vos
  2. Agregá a tu hijo/a
  3. Consentimiento parental
  4. Conectá WhatsApp
  5. Diagnóstico inicial
- Cada step con: círculo (número o check emerald cuando completo), título, descripción micro.
- Step actual destacado con border indigo y label "Ahora" en badge amber.
- Abajo del stepper: card pequeña "¿Necesitás ayuda?" con link al chat de soporte + tiempo estimado total "⏱ 4-6 minutos en total".

**Derecha (main, max-w-2xl):** contenido del step activo. Mostrar por defecto **Step 2 — Agregá a tu hijo/a** (el más denso para que Stitch lo diseñe completo).

**STEP 2 — Agregá a tu hijo/a**

Header del step:
- Eyebrow caption gris: "Paso 2 de 5".
- H2 "Contanos de tu hijo o hija" + descripción 18px gris: "Cuanto más nos cuentes, mejor lo acompaña el tutor. Todo esto lo podés editar después."

Card principal (radius 20px, shadow soft, padding 32):

- **Avatar uploader:** círculo 96px en indigo-100 con ícono de cámara, texto "Subí una foto (opcional)". Opcional explícito para respetar privacidad.
- **Input Nombre:** label + input con placeholder "Ej: Juan".
- **Input Apodo (opcional):** label helper "Cómo le gusta que le digan. El tutor lo va a llamar así".
- **Dos columnas:**
  - **Select Grado:** dropdown con opciones 1° a 12° grado.
  - **Select País y región:** default "Argentina · Catamarca (NOA)" — con subtítulo "Esto ajusta el currículo al oficial de tu provincia."
- **Radio group Género:** pills seleccionables (Niña / Niño / Prefiere no decir / Otro), radio oculto.
- **Checkbox multi Materias:** cards chequeables (no checkboxes tradicionales) con ícono + nombre: Matemática, Lengua, Ciencias naturales, Ciencias sociales, Inglés, Historia. Cada card radius 14px, cuando se selecciona borde indigo 2px y fondo indigo-50.
- **Sección colapsable "Contame más (opcional)" con chevron**:
  - Textarea "¿Qué le cuesta?" con placeholder "Ej: le cuesta arrancar la tarea solo; se frustra con fracciones".
  - Textarea "¿Qué le gusta?" con placeholder "Ej: dinosaurios, Minecraft, dibujar, fútbol — el tutor lo usa en los ejemplos".
  - Radio pills "Estilo que le funciona": Visual / Auditivo / Hands-on / No sabemos todavía.
- **Alerta info discreta con ícono info azul:** "El tutor IA usa esta info sólo para adaptar su forma de enseñar. Nunca compartimos datos con terceros."

Footer del step:
- Botón secundario ghost "← Volver" a la izquierda.
- Indicador "Progreso: 40%" + barra indigo.
- Botón primario pill indigo "Guardar y seguir →" a la derecha con ícono arrow-right animado.

**UI PATTERNS**
- Labels arriba del input siempre, 14px medium, neutral-700.
- Helper text 13px gris claro debajo del input.
- Error state: border danger + ícono alerta + mensaje rose.
- Focus state: ring 6px indigo/12% + borde indigo.
- Botones con micro-interaction: scale 0.98 on click.

**EMPATÍA EN COPY**
- Nunca "obligatorio/requerido", sí "para poder ayudarlo mejor".
- Nunca "campos", sí "contanos".
- Usar "vos" argentino siempre.
- Microcopy discreto que reduzca fricción: "Podés editarlo después desde tu panel."

**PREVIEW (lado derecho superior)**
Arriba del form, una card pequeña horizontal con el preview del perfil en tiempo real:
- Mini avatar + "Juan · 5° grado · Catamarca · Matemática + Lengua"
- Fondo indigo-50, radius 14px, padding 16.
- Se actualiza a medida que el padre llena el form.

**MOSTRAR TAMBIÉN — miniaturas de los 4 steps restantes abajo del stepper principal (opcional, si entra):**
- Step 1 Sobre vos: card con avatar padre + nombre + email + teléfono.
- Step 3 Consentimiento parental: card con checkbox aceptación + link a "Ley 26.061 resumida en 1 minuto" + disclaimer menores 13.
- Step 4 Conectá WhatsApp: card con ícono verde WhatsApp + número + botón "Recibir código" + campo OTP 6 dígitos.
- Step 5 Diagnóstico inicial: card de "empezar el juego" + botón amber "Empezar ahora (10 min)" con ilustración chica pensando.

**RESPONSIVE**
En mobile, el stepper colapsa a indicador horizontal arriba con sólo dots + step actual como chip.

**ACCESIBILIDAD**
- Focus trap dentro del step.
- Labels asociados a inputs.
- Radios y checkboxes con role y aria-checked.
- Anuncio de cambio de step con aria-live.
```

---

## Post-generación

1. HTML → `.stitch/designs/02-onboarding-padre.html`
2. Screenshot → `.stitch/designs/02-onboarding-padre.png`
3. Diseño principal es Step 2 (el más denso); reusar patrón para Steps 1, 3, 4, 5 en implementación.
4. Componentes shadcn a mapear: Input, Label, Select, RadioGroup, Checkbox, Button, Progress, Alert, Textarea.
