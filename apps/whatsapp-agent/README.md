# @educai/whatsapp-agent

Agente tutor de WhatsApp (canal principal de ApoyoAI). NestJS 10 + Twilio.

## Responsabilidad

- Recibir webhooks de Twilio WhatsApp.
- Identificar alumno por `whatsappPhone`.
- Validar suscripción activa + rate limit por plan.
- Orquestar:
  - **Claude Vision** si viene imagen (OCR del ejercicio).
  - **Whisper** si viene audio (transcripción).
  - **TutorAgent socrático** (desde `packages/ai`) para generar respuesta.
  - **ContentFilter** para detectar crisis emocional, bullying, abuso → derivar a humano.
- Persistir `Conversation` + `Message` en Prisma.
- Responder vía Twilio Messages API.

Fase 0 incluye el scaffold (bootstrap + webhook stub). Fase 1 implementa el flujo completo.

## Arranque local

```bash
pnpm --filter @educai/whatsapp-agent dev
```

En `http://localhost:4100/health` debería devolver `{ status: "ok" }`.

Para probar con Twilio WhatsApp sandbox:
1. Crear cuenta Twilio → WhatsApp Sandbox → join code.
2. Exponer localhost con `ngrok http 4100`.
3. Configurar webhook del sandbox en `https://<ngrok>.ngrok.io/webhooks/twilio/whatsapp`.
4. Enviar un mensaje desde tu WhatsApp al número de Sandbox.

## Seguridad

- `TWILIO_WEBHOOK_VALIDATION=true` verifica la firma Twilio (configurado en Fase 1).
- Nunca loguear el contenido del mensaje del alumno (compliance menores).
- Derivación obligatoria a humano ante señales de crisis — implementado en Fase 1.
