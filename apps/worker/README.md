# @educai/worker

Procesador de jobs asíncronos. NestJS 10 + BullMQ + Redis.

## Queues

- **`weekly-report`** — genera el reporte semanal de ApoyoAI para familias Premium/Familiar.
  Corre todos los domingos a las 20:00 AR. Agrega datos de `LearningSession`, `Message`,
  `Achievement`; genera resumen narrativo con Claude; guarda en `ParentReport`; envía por email
  (React Email + Resend) y WhatsApp.

- **`diagnostic-analysis`** — procesa el diagnóstico adaptativo al finalizar la evaluación
  inicial. Analiza respuestas, genera informe narrativo con Claude, escribe
  `StudentProfile.diagnosticScore`, notifica al padre.

Fase 0 tiene el scaffold con los stubs. Fase 1 implementa la lógica completa.

## Arranque local

```bash
pnpm docker:up      # levanta redis
pnpm --filter @educai/worker dev
```

`http://localhost:4200/health` → `{ status: "ok" }`.

## Variables de entorno

Ver `.env.example`. `REDIS_URL` y `ANTHROPIC_API_KEY` son obligatorias para Fase 1.
