# Politica De Costos Y Tokens

EducAI debe sentirse inteligente sin gastar de mas. La calidad se cuida tanto
como el margen.

## Principios

1. Usar IA solo cuando agrega valor.
2. Resolver con templates cuando el resultado es repetible.
3. Pedir JSON corto para automatizaciones.
4. Evitar respuestas largas por defecto.
5. No reenviar historiales completos si alcanza con resumen.
6. Separar instrucciones estaticas de contexto dinamico para poder cachear.
7. Registrar tokens usados y modelo usado cuando haya llamada real.

## Politica Por Tarea

### Baja complejidad

Ejemplos: botones, textos breves, etiquetas, estados vacios.

Accion: no llamar al LLM. Usar copy local o templates.

### Media complejidad

Ejemplos: plan de clase, rubrica breve, secuencia didactica.

Accion: usar modelo costo/beneficio, temperatura baja, salida JSON y limite de
tokens.

### Alta complejidad

Ejemplos: analisis curricular, casos con riesgo pedagogico, situaciones
sensibles.

Accion: usar modelo fuerte, salida estructurada, guardrails y revision humana.

## Limites Recomendados

- Planificacion: max 1800 tokens de salida.
- Analisis curricular: max 1400 tokens de salida.
- Tutor estudiante: max 700 tokens de salida.
- OCR: solo transcribir, no resolver.
- Audio: transcribir y resumir, no conversar desde audio completo.

## Cuando Escalar A Humano

- Crisis emocional.
- Bullying, abuso o violencia.
- Datos sensibles dudosos.
- Conflictos institucionales.
- Reclamos de familias.
- Evaluaciones de alto impacto.

## Frase Interna

Primero utilidad, despues extension. Primero template, despues modelo caro.
