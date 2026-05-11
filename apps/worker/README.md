# @educai/worker

Procesador de jobs asincronos de EducAI. NestJS 10 + BullMQ + Redis.

## Estado actual

- registra las colas `weekly-report` y `diagnostic-analysis`;
- expone `GET /health`;
- valida variables criticas en `production`;
- los processors todavia conservan implementacion parcial y logging base.

## Arranque local

```bash
pnpm --filter @educai/worker dev
```

`http://localhost:4200/health` debe responder `{"status":"ok"}`.

## Variables importantes

- `REDIS_URL`
- `DATABASE_URL`
- `ANTHROPIC_API_KEY`

## Notas operativas

- `weekly-report` y `diagnostic-analysis` ya tienen contrato de job y processor registrado.
- la logica completa de agregacion, persistencia y entrega sigue pendiente.
