# Prompt Stitch — 01. Landing ApoyoAI (B2C padres)

**Device:** DESKTOP
**Intent:** conversión. Padre argentino de clase media-alta que busca apoyo escolar para su hijo y se resiste a pagar profe particular caro. Debe sentir que **sí, funciona**, que es seguro para el hijo, y que puede probar sin tarjeta.

---

## Pegar este prompt en Stitch

```
Generá una landing page de conversión para "ApoyoAI", un tutor de IA por WhatsApp para alumnos de primaria y secundaria argentinos, pagado por los padres. Empresa: Nativos Consultora Digital. Producto del ecosistema EducAI LATAM. Desktop-first, responsive, app router Next.js 14 + Tailwind + shadcn/ui.

**VIBE y ATMÓSFERA**
Cálida, esperanzadora, humana y moderna. Inspirada en Duolingo y Notion for Education mezclado con la calidez de Vercel Ship, pero con identidad argentina. Nada de edtech aburrido corporate. Que un padre ocupado se detenga a mirar 10 segundos. Tono aspiracional pero cercano, uso de "vos" argentino.

**DESIGN SYSTEM (REQUIRED)**
- Platform: Web, Desktop-first responsive
- Palette:
  - Brand Primary: #4F46E5 (indigo-600, CTA principal)
  - Brand Secondary: #F59E0B (amber-500, acento cálido)
  - Warm: #FB7185 (coral, tags achievements)
  - Soft BG: #EEF2FF (indigo-50, secciones)
  - Neutrals: slate scale (#F8FAFC canvas, #0F172A text, #64748B muted)
- Typography: Inter Tight (headings, tracking tight -0.02em), Inter (body). Display xl 72px bold, h2 32px, body 18px.
- Roundness: muy redondeado. Cards radius 20px. Buttons pill-shaped (rounded-full).
- Shadows: floating soft (0 12px 32px rgba(15,23,42,0.08)) en cards y CTAs.
- Micro-animations: bouncy spring on hover, subtle float idle.

**ESTRUCTURA DE LA PÁGINA**

1. **Sticky navbar transparente con glassmorphism al hacer scroll:**
   - Logo "ApoyoAI" a la izquierda (wordmark indigo con pequeño ícono de chat).
   - Items centrados: "Cómo funciona", "Planes", "Para colegios", "Historias reales".
   - A la derecha: link "Iniciar sesión" en ghost + CTA primario "Probar gratis 7 días" pill indigo.
   - Badge pequeño "🇦🇷 Hecho en Argentina" discreto junto al logo.

2. **Hero section a dos columnas con generous whitespace:**
   - Izquierda: headline display-xl "Tu hijo puede. Vos no tenés que saberlo todo." con "puede" destacado en indigo gradient. Sub headline 20px gris: "Un tutor de inteligencia artificial que acompaña a tu hijo en matemática, lengua y ciencias — por WhatsApp, todos los días, sin juzgarlo."
   - Debajo: dos CTAs en row — primario pill indigo "Empezar gratis 7 días" (sin ingresar tarjeta) + secundario ghost "Ver cómo funciona" con ícono play. Micro-copy gris claro: "No requiere tarjeta. Cancelás cuando quieras."
   - Social proof inline: avatares pequeños apilados + "Más de 1.200 familias argentinas ya confían" + 5 estrellas amber.
   - Derecha: **mockup realista de conversación de WhatsApp** dentro de un frame de celular redondeado con sombra flotante. Mostrar una conversación real (3-4 burbujas): alumno pregunta duda de fracciones con foto del ejercicio, tutor responde con preguntas socráticas guiadas, alumno entiende. Timestamps reales AR. Preview image verde whatsapp.

3. **Franja de social proof con logos + métricas:**
   - Fondo soft indigo-50.
   - 4 métricas en fila con números grandes amber: "+1.200 familias", "+50.000 dudas resueltas", "8/10 NPS", "94% retención mensual".
   - Debajo: "Avalados por" + logos grises de universidades e instituciones (UNCa, UNT, UNSa placeholders + BID Lab + Fundación Varkey).

4. **Sección "Cómo funciona" — 4 pasos horizontales con ilustraciones:**
   - Card grid 4 columnas en desktop, stack en mobile.
   - Cada card: ícono ilustrado 64px en círculo indigo-100, número grande gris (01, 02, 03, 04), título h4, descripción breve 2 líneas.
   - Pasos: "Creás el perfil de tu hijo" / "La IA hace un diagnóstico jugado" / "Estudia por WhatsApp cuando quiere" / "Vos ves su progreso cada semana".
   - Cards redondeadas 20px, border neutral-200, hover eleva con sombra float.

5. **Sección "Para qué sirve" con tabs horizontales y demo interactiva:**
   - Tabs pill: Matemática / Lengua / Ciencias / Examen próximo / Dudas sueltas.
   - Debajo cada tab muestra: título grande + descripción + mini preview de chat WhatsApp a la derecha con ejemplo real de esa materia.
   - Ejemplo MATEMÁTICA: "Le saca el miedo a los números" + burbuja de chat mostrando una fracción resuelta paso a paso.

6. **Franja "Lo que dicen los padres" — 3 testimoniales con fotos reales:**
   - Cards blancas radius 20px sombra soft.
   - Foto circular 56px (padres LATAM reales, no stock gringo), nombre + "mamá de Juan, 5° grado, Catamarca".
   - Quote en 20px, emoji discreto al final.
   - Un testimonial: "Martín (12) no quería estudiar con nadie. Con el tutor por WhatsApp se enganchó solo. Sus notas subieron. Y yo recuperé la cena familiar."

7. **Sección "Pricing" — 4 planes en cards:**
   - Cards columnas iguales, la "Premium" destacada con border indigo 2px + badge amber "Más elegido" arriba + shadow float.
   - Plan Free (ARS 0): 10 mensajes/día, 1 materia, diagnóstico inicial.
   - Plan Basic (ARS 6.000/mes ≈ USD 6): ilimitado, 2 materias.
   - Plan Premium (ARS 12.000/mes ≈ USD 12): todas las materias, reportes semanales, modo examen, prioridad.
   - Plan Familiar (ARS 20.000/mes ≈ USD 20): hasta 3 hijos, todo Premium.
   - Cada card: nombre plan, precio grande, descripción línea, lista features con check verde emerald + items en gris, CTA pill "Empezar con [plan]" en el color del plan.
   - Arriba: toggle Mensual / Anual (anual descuento 15%).

8. **Sección "Seguridad primero" — franja slate-900 fondo oscuro:**
   - Título "Pensado para tu tranquilidad, diseñado con tu hijo en mente" en blanco.
   - 4 tarjetas en fila con icono outline blanco, título pequeño, texto body-sm en slate-300:
     - "Consentimiento parental explícito — Ley 26.061"
     - "Nunca da la respuesta — método socrático probado"
     - "Alertas si detecta crisis emocional — derivamos a profesionales"
     - "Datos encriptados — auditoría externa anual"
   - Debajo: pequeño pill "Certificado por nuestro consejo académico" con nombres de pedagogos placeholder.

9. **Sección FAQ — accordion clean:**
   - 6 preguntas típicas: "¿Mi hijo se vuelve dependiente?", "¿Cuánto tiempo debería usarlo por día?", "¿Y si le da la respuesta y no aprende?", "¿Qué pasa con la privacidad?", "¿Puedo cancelar cuando quiera?", "¿Funciona para preparar el secundario?".
   - Respuestas de 3 líneas cada una, honestas.

10. **CTA final grande — sección full-width con gradient indigo→coral soft:**
    - "Probá ApoyoAI gratis una semana. Sin ingresar tarjeta."
    - Form inline: input teléfono WhatsApp + CTA pill amber "Recibir link por WhatsApp".
    - Debajo: "Cancelás cuando quieras. Te acompañamos en el setup."

11. **Footer — oscuro slate-950 denso:**
    - Grid 5 columnas: branding + 4 columnas de links (Producto, Colegios, Legal, Empresa).
    - Selector de idioma español (AR / Neutro).
    - Redes sociales: Instagram, TikTok, YouTube, LinkedIn.
    - Bottom bar: "© 2026 Nativos Consultora Digital. Hecho con ❤️ en Catamarca para LATAM." + badges "Ley 26.061" y "LGPD ready".

**DETALLES DE INTERACCIÓN**
- Navbar: transparente al top, glass blur y sombra al scroll >80px.
- Hero: mockup WhatsApp con mensaje "escribiendo..." que se anima cada 4s, simulando conversación real.
- Botones pill con transform translateY(-2px) al hover.
- Section reveals con fade + slide-up 20px cuando entran al viewport.
- Tabs de "Para qué sirve": transición suave del mockup al cambiar de materia.

**ACCESIBILIDAD**
- Contraste ≥ 4.5:1 en todo texto.
- Focus ring visible indigo translúcido 6px en tab.
- Alt text en todas las imágenes (describir escenas, no sólo "imagen").
- Jerarquía h1 > h2 > h3 estricta.
```

---

## Post-generación

1. Descargar HTML → `.stitch/designs/01-landing-apoyoai.html`
2. Descargar screenshot → `.stitch/designs/01-landing-apoyoai.png`
3. Revisar contraste con herramienta externa (WebAIM).
4. Marcar componentes shadcn reutilizables: Button, Card, Accordion, Tabs, Badge.
