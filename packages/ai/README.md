# @educai/ai

Motor pedagógico de EducAI/ApoyoAI: tutor IA socrático Claude, OCR de fotos de
ejercicios, transcripción de audios, evaluación diagnóstica adaptativa, filtros
de seguridad para menores y wrappers Claude/OpenAI con prompt caching.

## Variables de entorno

```bash
ANTHROPIC_API_KEY=sk-ant-...   # Claude (tutor + OCR Vision)
OPENAI_API_KEY=sk-...          # Whisper (audio)
```

## Componentes

### TutorAgent (motor del tutor IA socrático)

```ts
import { TutorAgent, AnthropicLlmClient } from "@educai/ai";

const llm = new AnthropicLlmClient({ apiKey: process.env.ANTHROPIC_API_KEY });
const agent = new TutorAgent(llm, { model: "claude-sonnet-4-6", maxTokens: 700 });

const response = await agent.respond({
  studentName: "Mateo",
  grade: 5,
  subject: "matematica",
  message: "no entiendo cómo sumar 1/2 + 1/4",
  learningStyle: "visual",
  recentHistory: "Última sesión: trabajamos fracciones equivalentes",
});

console.log(response.content); // respuesta del tutor (texto)
console.log(response.safety.status); // safe | monitor | escalate
console.log(response.recommendedAction); // continue | de_escalate | redirect_off_topic | human_handoff | consolidate
console.log(response.cache); // métricas de prompt caching
```

El TutorAgent:

1. Pasa el mensaje por `filterStudentContent` para detectar crisis, bullying, jailbreaks, frustración.
2. Si hay crisis (suicidio, autolesión, abuso, violencia), bypassea el LLM y devuelve un template de derivación a líneas de ayuda (102 Argentina) — no genera contenido.
3. Si hay frustración, agrega un hint de de-escalate al user message para que Claude baje dificultad.
4. Si hay off-topic, agrega un hint de redirect al contenido de la materia.
5. Construye system prompt en dos blocks: estático (cacheable, reglas pedagógicas + few-shot) + dinámico (alumno + grado + materia + historial).
6. Llama al LLM con `prompt caching` activado en el block estático.

### Prompt caching

El system prompt del tutor está dividido para maximizar cache hits:

- **Block estático** (`TUTOR_STATIC_SYSTEM_PROMPT`): identidad, reglas pedagógicas no negociables, límites de seguridad, 7 ejemplos few-shot, formato de respuesta. **Cacheable** con `cache_control: ephemeral`. Mismo para todos los alumnos.
- **Block dinámico**: nombre del alumno, grado, materia, estilo, historial. **No cacheable** — cambia por sesión.

El mínimo cacheable en `claude-sonnet-4-6` es 4096 tokens. El block estático supera ese umbral con margen.

Verificar hits en producción:

```ts
console.log(response.cache);
// { cacheCreationInputTokens: 4200, cacheReadInputTokens: 0 }      ← primer request
// { cacheCreationInputTokens: 0,    cacheReadInputTokens: 4200 }   ← segundos request en adelante (~90% cheaper)
```

### OcrService (Claude Vision)

```ts
import { OcrService } from "@educai/ai";

const ocr = new OcrService({ apiKey: process.env.ANTHROPIC_API_KEY });

// Acepta URL HTTPS o data URI base64
const result = await ocr.extractTextFromImage("https://api.twilio.com/...");

console.log(result.text); // transcripción del ejercicio
console.log(result.confidence); // 0.9 si lectura ok, 0.1 si borroso/ilegible
console.log(result.blurry); // true si el modelo dijo UNREADABLE
```

Garantías:

- Whitelist de media types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- Tamaño máximo: 5 MB (configurable con `maxImageBytes`).
- System prompt restrictivo: el OCR sólo transcribe, no resuelve. Bloquea contenido inapropiado.

### AudioService (Whisper)

```ts
import { AudioService } from "@educai/ai";

const audio = new AudioService({ apiKey: process.env.OPENAI_API_KEY });
const result = await audio.transcribe("https://api.twilio.com/...", "es");

console.log(result.text); // transcripción
console.log(result.durationSeconds); // duración del audio
```

Modelo: `whisper-1`. Idioma default: `es` (Whisper detecta automáticamente el dialecto rioplatense).

Garantías:

- Whitelist de media types audio.
- Tamaño máximo: 25 MB (límite duro de Whisper).

### Filtro de contenido

```ts
import { filterStudentContent, inferRecommendedAction } from "@educai/ai";

const safety = filterStudentContent("a veces pienso en matarme");

console.log(safety.status); // "escalate"
console.log(safety.signals); // ["crisis_suicide"]
console.log(safety.crisisAlert?.severity); // "critical"
console.log(safety.crisisAlert?.helplines);
// [
//   "Línea 102 (chicos y adolescentes, gratis, 24hs)",
//   "Línea 144 (violencia de género, gratis, 24hs)",
//   "Centro de Asistencia al Suicida 135 (CABA y GBA) o 0800-345-1435 (resto del país)"
// ]
```

Categorías de signals detectados:

| Signal                                                                  | Status     | Acción                                           |
| ----------------------------------------------------------------------- | ---------- | ------------------------------------------------ |
| `crisis_suicide`, `crisis_self_harm`, `crisis_abuse`, `crisis_violence` | `escalate` | Derivar a humano + notificar padre + helplines   |
| `harassment_bullying`                                                   | `monitor`  | Validar, registrar, alertar al padre             |
| `direct_answer_request`, `instruction_override`                         | `monitor`  | Mantener tutoría socrática, no ceder             |
| `frustration`                                                           | `monitor`  | De-escalate (bajar dificultad, validar esfuerzo) |
| `off_topic`, `sexual_content`, `drugs_alcohol`                          | `monitor`  | Redirigir a la materia                           |
| `inappropriate_language`                                                | `monitor`  | Bajar el tono, no devolver el insulto            |
| `confusion`                                                             | `monitor`  | Indicador pedagógico, no problema                |

### ContextBuilder

Comprime el historial de conversaciones y snippets de currículo cuando el contexto se acerca al budget de tokens:

```ts
import { ContextBuilder } from "@educai/ai";

const builder = new ContextBuilder({ maxApproxTokens: 1500 });
const context = builder.build({
  studentName: "Mateo",
  grade: 5,
  subject: "matematica",
  recentHistory: ["...", "...", "..."],
  curriculumSnippets: ["...", "..."],
});
```

### DiagnosticService

Motor adaptativo de evaluación inicial. Genera 15 preguntas, sube/baja dificultad según las respuestas, devuelve resumen con fortalezas y oportunidades. Ver `services/diagnostic.service.ts`.

## Modelos por defecto

| Componente   | Modelo               | Razón                                                    |
| ------------ | -------------------- | -------------------------------------------------------- |
| TutorAgent   | `claude-sonnet-4-6`  | Mejor razonamiento pedagógico, vision GA, prompt caching |
| OcrService   | `claude-sonnet-4-6`  | Vision de alta resolución (hasta 2576px)                 |
| AudioService | `whisper-1` (OpenAI) | Whisper sigue siendo el más confiable para es-AR         |

## Tests

```bash
pnpm --filter @educai/ai test
```

31 tests cubriendo: cliente Anthropic con prompt caching, system blocks estático/dinámico, filtros de seguridad (crisis, bullying, jailbreaks, frustración, off-topic, lenguaje), TutorAgent (matemática normal, frustración, crisis, jailbreak, off-topic, OCR, audio).

## Guión de prueba manual

Ver `docs/claude/tutor-test-scenarios.md` para 10 conversaciones simuladas con la respuesta esperada (5° fracciones, 12° integrales, foto borrosa, "soy un burro", crisis, etc.).
