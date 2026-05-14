# @educai/whatsapp-agent

Agente de WhatsApp para EducAI. NestJS 10 + Twilio + Prisma.

## Estado actual

- expone `POST /webhooks/twilio/whatsapp`;
- valida firma de Twilio con `TwilioSignatureGuard`;
- resuelve estudiante, aplica rate limiting y enruta entre tutor académico y agente institucional;
- persiste conversaciones y mensajes;
- persiste handoffs humanos como `AuditLog` con accion `human_handoff.requested`;
- incluye flujo diagnostico conversacional;
- permite elegir cerebro `Anthropic` u `OpenAI` por variable de entorno;
- todavia depende de credenciales e integraciones reales para operar en produccion.

## Arranque local

```bash
pnpm --filter @educai/whatsapp-agent dev
```

`http://localhost:4100/health` debe responder `{"status":"ok"}`.

## Variables importantes

- `DATABASE_URL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_PUBLIC_WEBHOOK_URL`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `EDUCAI_AGENT_PROVIDER=anthropic|openai`
- `EDUCAI_AGENT_MODEL`

## Notas operativas

- Twilio envia el webhook como `x-www-form-urlencoded`.
- La respuesta al alumno se envia via Messages API, no como TwiML inline.
- Las consultas institucionales se responden con tools controladas por codigo; si falta contexto o el caso es sensible, se deriva a humano.
