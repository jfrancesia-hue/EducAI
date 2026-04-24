# ADR-003 — Claude como LLM primario del ecosistema

- **Status:** Aceptado
- **Fecha:** 2026-04-24
- **Fase:** 0 (Setup)

## Contexto

El tutor pedagógico de ApoyoAI y el motor de EducAI (diagnóstico curricular, generación de
planificaciones, análisis de deserción) dependen críticamente de un LLM. Necesitamos:

- Razonamiento pedagógico socrático robusto (no dar la respuesta, guiar con preguntas).
- Seguimiento de instrucciones muy estrictas (política anti-jailbreak, filtros de contenido).
- Generación de contenido largo estructurado (planificaciones, ADRs para colegios).
- Latencia razonable (<8s para tutor por WhatsApp).
- Costo controlable a escala B2C.
- Caching de prompts (prompts del sistema educativo son largos y repetidos).

## Decisión

- **Claude (Anthropic)** como LLM primario para todas las tareas de razonamiento.
  - Modelo por defecto: `claude-opus-4-7` para razonamiento pedagógico.
  - Modelo económico: `claude-haiku-4-5` para clasificación, ruteo, filtros.
- **OpenAI** como LLM secundario para:
  - Embeddings (`text-embedding-3-large`) → pgvector RAG.
  - Generación masiva de ejercicios (`gpt-4o-mini`).
- **Whisper** (OpenAI) para audio → texto de WhatsApp.
- **Claude Vision** (via Claude API) para OCR de ejercicios en foto.
- **Prompt caching de Anthropic** habilitado en todos los llamados al tutor y motor curricular.

## Alternativas consideradas

- **OpenAI como primario**: peor seguimiento de instrucciones complejas en pruebas internas,
  historial de leaks en jailbreaks educativos. Descartado como primario pero adoptado como
  secundario.
- **Gemini**: buena en LATAM por disponibilidad pero restricciones en menores y políticas poco
  claras. Descartado por compliance.
- **Self-hosted LLM (Llama 3.1)**: ahorraría costos pero la calidad pedagógica es insuficiente
  al momento de la decisión. Re-evaluar en Fase 5.

## Consecuencias

### Positivas
- Un solo proveedor principal simplifica auditoría, SLA, y facturación.
- Prompt caching reduce costos ~70% en conversaciones del tutor.
- Anthropic tiene política explícita de no-training con data de API, clave para datos de menores.

### Negativas
- Dependencia de proveedor único. Mitigación: `packages/ai/llm/types.ts` abstrae el cliente LLM
  para permitir swap.
- Cuotas de Anthropic requieren negociar account manager a escala (meta: 10k+ familias).
- Costo por familia Premium estimado USD 0.80/mes (con caching). A escalar con prompt tuning.

## Referencias

- [Feedback memory](../../CLAUDE.md): "usar siempre Claude (Anthropic SDK) para todas las APIs de
  agentes e IA".
- Anthropic prompt caching: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- Policy menores Anthropic: https://www.anthropic.com/legal/usage-policy
