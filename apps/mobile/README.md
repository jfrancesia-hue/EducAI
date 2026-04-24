# @educai/mobile

App móvil de ApoyoAI (alumnos + padres). Expo 51 + React Native + NativeWind + expo-router.

Stub en Fase 0 con home screen. Fase 3 implementa el flujo mobile completo (perfil, chat con
tutor como complemento de WhatsApp, progreso gamificado, logros).

## Arranque local

```bash
pnpm --filter @educai/mobile dev
```

Luego escanear el QR con Expo Go (iOS/Android), o correr `pnpm --filter @educai/mobile android`
/ `... ios`.

## Distribución

- **EAS Build** para binarios de App Store y Play Store.
- **EAS Update** para OTA (sólo JS bundle).
- Bundle ID / package: `digital.nativos.apoyoai`.

## Offline-first

Los alumnos de NOA y LATAM tienen conectividad intermitente. Desde Fase 3 implementamos:
- Cache local de conversaciones y ejercicios.
- Sync diferido con la API cuando hay red.
- Fallback SMS (via Twilio) para zonas sin datos.
