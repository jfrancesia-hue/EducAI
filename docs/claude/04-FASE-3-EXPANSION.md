# Fase 3 — Expansión: Módulos Transversales

**Duración:** 8-10 semanas
**Objetivo:** Agregar módulos que aumentan retención, diferenciación de mercado y preparan entrada al sector público.

---

## Módulos de esta fase

1. **Portfolio Digital del Alumno** (credenciales verificables)
2. **BienestAR** (bienestar socioemocional)
3. **Escuela de Padres**
4. **Vida Real** (finanzas, IA, ciudadanía digital)
5. **Gamificación y sistema de hábito**
6. **Marketplace de profesores humanos**
7. **Modo offline y SMS**
8. **Integridad académica con IA**

---

## Prompt 1: Portfolio Digital + Credenciales Verificables

```
Implementá el módulo Portfolio Digital del Alumno.

## VISIÓN
Cada alumno tiene un portfolio que acumula evidencias de aprendizaje a lo largo de su trayectoria escolar. Al terminar secundaria, tiene un historial real (no solo un analítico) que puede mostrar a universidades, empleadores, programas de becas.

## COMPONENTES

### Evidencias
- Tipos: trabajo escrito, video, audio, imagen, presentación, proyecto, certificado externo, competencia.
- Cada evidencia tiene: título, descripción, contexto, competencias asociadas, fecha, autor (alumno), validador (docente), nivel de logro.
- Privacidad: alumno decide qué es público, qué es privado, qué es compartible con link.

### Competencias tracker
- Framework base: 21st Century Skills (comunicación, colaboración, pensamiento crítico, creatividad) + competencias curriculares.
- Visualización: radar, línea de tiempo, niveles.
- Evidencia-to-competencia: cada evidencia contribuye a 1+ competencias.

### Credenciales verificables
- Al consolidar logros (ej: "Maestría en álgebra básica" tras 30 evidencias validadas), el sistema emite una credencial verificable.
- Estándar: Open Badges 3.0 + DID (Decentralized Identifiers).
- Opcional: anclaje blockchain (aprovechar tu experiencia con blockchain gubernamental).
- Verificable públicamente por tercero con QR o URL.

### Export
- PDF presentable.
- Página pública `/u/<username>` (opt-in).
- JSON LinkedIn-compatible.

## TAREA TÉCNICA

1. PortfolioModule en apps/api con endpoints CRUD + validación docente.
2. Schema Prisma: Evidence, Competence, CompetenceLevel, Credential, CredentialVerification.
3. Sistema de firmas criptográficas para credenciales (libsodium).
4. Generador de badges visuales con SVG.
5. Página pública del portfolio con diseño tipo "Linktree / Read.cv".
6. Integración con blockchain opcional (anclaje hash en red pública, no PII).

## REGLAS
- Menores de edad: consentimiento parental para hacer pública cualquier parte.
- GDPR/LGPD: derecho al olvido, export, portabilidad.
- Docente validador queda registrado como "atestador" de cada logro.
- Sin datos sensibles en la cadena (solo hashes).

Tests:
- Alumno sube evidencia, docente valida.
- Sistema emite credencial tras X evidencias validadas en misma competencia.
- Credencial se verifica correctamente con URL pública.
- Alumno revoca evidencia pública, se vuelve privada sin borrar historial.
```

---

## Prompt 2: BienestAR (Bienestar Socioemocional)

```
Implementá el módulo BienestAR.

## IMPORTANTE
Este módulo es de altísima sensibilidad. El diseño debe ser revisado por profesionales de salud mental antes del lanzamiento. Escribir el código no reemplaza esa validación.

## FUNCIONALIDAD

### Check-in emocional
- Diario, 30 segundos, gamificado (emojis, mood meter).
- Opciones: ánimo, energía, nivel de estrés, sueño, una pregunta abierta opcional.

### Detección de patrones
- IA analiza series temporales: caídas sostenidas, cambios bruscos, signals en mensajes al tutor.
- Sin diagnosticar nunca. Solo detectar signals y derivar.

### Biblioteca de recursos
- Ejercicios de respiración, mindfulness adaptado a edad.
- Técnicas pre-examen (ansiedad).
- Cómo pedir ayuda.
- Cómo ser aliado ante bullying.

### Protocolo de alertas
- 3 niveles:
  - Verde: patrón estable positivo.
  - Amarillo: señales leves (caída temporal, estrés) → recursos al alumno + aviso suave al padre.
  - Rojo: señales graves (mención de autolesión, abuso, ideación suicida, bullying severo) → protocolo inmediato:
    - Mensaje de contención (no "vos estás bien", sino "te escucho, no estás solo, hay gente que puede ayudarte").
    - Recursos de crisis del país (Centro de Asistencia al Suicida Argentina: 135, etc.).
    - Notificación inmediata al tutor del colegio (si EducAI) o padre configurado como contacto de emergencia.
    - Log auditable.

### Derivación profesional
- Marketplace de psicólogos verificados para familias que quieran apoyo externo.
- Videollamada integrada.

## TAREA

1. Schema: EmotionalCheckin, EmotionalSignal, AlertLog, Resource.
2. CheckinService con cron diario de recordatorio.
3. PatternDetectionService (background job): analiza últimas 2 semanas, detecta anomalías estadísticas + análisis IA de lenguaje.
4. AlertService con niveles y canales configurados.
5. ResourceLibrary con contenido curado por profesionales (flag `professionally_reviewed`).
6. ProfessionalDirectoryModule para marketplace de psicólogos.
7. Flujo mobile-first del check-in (10 segundos, tap-tap).

## REGLAS INNEGOCIABLES
- Nunca publicar esta feature sin revisión de al menos 2 psicólogos infantojuveniles.
- Jamás compartir datos emocionales con terceros (ni colegio sin consentimiento familiar, ni anunciantes, nunca).
- Transparencia total con los padres sobre qué ve el sistema.
- El alumno puede pedir que el padre NO vea el check-in (desde cierta edad configurada). En ese caso, el padre ve solo agregados anónimos.
- Modo "respeto a la intimidad del adolescente": entre 13-17 años, configurable qué ve el padre.
- Crisis protocol tiene que estar escrito en un documento aparte revisado legalmente.

Tests:
- Simulación de patrón descendente → alerta amarilla.
- Mensaje con palabra de crisis → alerta roja + protocolo.
- Alumno resuelve alerta con check-in positivo → alerta se cierra.
- Padre intenta ver check-in de hijo de 15 años con privacidad activada → solo ve resumen.
```

---

## Prompt 3: Escuela de Padres

```
Implementá el módulo Escuela de Padres.

## CONTENIDO

### Microcursos (5-15 min cada uno)
- Cómo ayudar con matemática sin frustrarte (por grado).
- Adolescencia y pantallas.
- Cómo hablar de sexualidad según la edad.
- Acompañar en duelo, separación, mudanza.
- Detectar bullying y ciberbullying.
- Primera vez con redes sociales.
- Cuando el hijo dice "odio la escuela".
- Límites sin gritos.
- Cómo elegir secundario / universidad.

### Traductor pedagógico
El padre recibe notificación: "Tu hijo está viendo ecuaciones de segundo grado." Con un click, aparece:
- Explicación de 3 min para adultos.
- Cómo puede ayudarlo sin hacerle la tarea.
- Errores comunes a evitar.

### Grupos de apoyo
- Grupos por colegio/grado.
- Moderación por profesionales (opcional pagado).
- Calendario de encuentros virtuales mensuales.

### Coaching parental
- Marketplace de coaches parentales.
- Sesiones 1:1 online.

## TAREA

1. ParentCourseModule con catálogo y progreso.
2. TopicTranslatorService: dado un tema pedagógico, genera versión para padres con Claude.
3. SupportGroupModule: grupos, mensajes, encuentros (integración con Jitsi o Daily.co).
4. CoachMarketplaceModule: coaches verificados, booking, pagos, videollamada.

## REGLAS
- Cursos gratuitos para plan Premium+ de ApoyoAI.
- Coaching siempre pago (comisión 25%).
- Moderación estricta: padres suben contenido ofensivo = baneados.

Tests estándar de un módulo CRUD + marketplace.
```

---

## Prompt 4: Vida Real (Finanzas, IA, Ciudadanía Digital)

```
Implementá el módulo Vida Real.

## ÁREAS TEMÁTICAS

### Finanzas personales (por edad)
- 8-11 años: qué es el dinero, ahorro.
- 12-15 años: primer ingreso, tarjetas, intereses.
- 16-18 años: trabajos, impuestos básicos, alquiler, crédito.

### Ciudadanía digital
- Privacidad online, contraseñas, 2FA.
- Detección de fake news, deepfakes, manipulación.
- Huella digital: qué publicar y qué no.
- Ciberbullying y cómo actuar.
- Derechos digitales.

### IA para todos
- Qué es IA y cómo usarla (no copiar la tarea, sino aprender).
- Prompting básico.
- Pensamiento crítico sobre respuestas de IA.
- Ética y sesgos.
- Futuro del trabajo.

### Pensamiento crítico
- Argumentación.
- Falacias comunes.
- Método científico aplicado a lo cotidiano.
- Estadística para no dejarte engañar.

### Primer empleo
- CV y LinkedIn.
- Entrevistas.
- Derechos laborales básicos.
- Emprendimiento.

## FORMATO
- Microlearning: lecciones de 3-8 min.
- Interactivo: simuladores, quizzes, casos reales.
- Gamificado: rachas, medallas, ranking entre amigos.
- Certificaciones: insignia al completar un área.

## TAREA

1. LifeContentModule con lecciones estructuradas.
2. Simuladores interactivos (componentes React):
   - "Administrá tu primer sueldo" (presupuesto).
   - "Detectá la estafa" (phishing).
   - "Crédito o ahorro" (interés compuesto).
   - "Fake or real" (imágenes reales vs deepfakes).
   - "Entrevista de trabajo con IA" (el alumno practica con Claude).
3. Quiz adaptativo con explicaciones enriquecidas.
4. Integración con el sistema de credenciales del Portfolio.

## MONETIZACIÓN EXTRA
- Sponsorships editoriales: bancos/fintech patrocinan el área finanzas.
- Contenido siempre independiente, pero con "Presentado por X" al pie.
- Línea estricta de no-vender productos al alumno.

Tests:
- Simulador de presupuesto calcula correctamente.
- Quiz adaptativo ajusta dificultad.
- Insignia se emite al completar.
```

---

## Prompt 5: Sistema de Gamificación y Hábito

```
Implementá el sistema transversal de gamificación de ApoyoAI.

## MECÁNICAS

### Rachas (streaks)
- 1 streak = 1 día con actividad mínima (ej: 10 min de tutor).
- Hitos: 7, 14, 30, 90, 365 días.
- Freeze streak: 1 "día libre" cada 7 días (para no castigar fines de semana legítimos).
- Notificación amigable si está por romper racha.

### Puntos (XP)
- Acciones recompensadas: completar sesión, responder check-in, resolver ejercicio correctamente (proceso > respuesta).
- Bonificación por constancia vs volumen.

### Niveles
- 1-100, nombres inspiradores (no militares). Ej: Explorador, Descubridor, Sabio.
- Cada nivel desbloquea: avatares, personalización, mini-desafíos.

### Medallas
- Por competencia: "Maestro de fracciones", "Lector veloz", "Escritor creativo".
- Por hábito: "30 días seguidos", "Madrugador", "Persistente" (después de 5 errores seguidos, éxito).

### Ranking (opcional)
- Solo entre amigos agregados manualmente.
- Nunca global ni entre desconocidos.
- Configurable, desactivable.

### Desafíos
- Diarios (10 min).
- Semanales (proyecto).
- Entre amigos ("desafiá a tu hermano a resolver 5 problemas de regla de tres").

## REGLAS PEDAGÓGICAS (NO NEGOCIABLES)
- Recompensar proceso, no solo resultado.
- Cero competencia tóxica: no comparar con otros sin consentimiento.
- Cero scarcity: no "te quedan 3 vidas" ni mecánicas ansiógenas.
- Chicos con más tiempo libre no deben aplastar a chicos con menos. Los rankings son por progreso personal, no absoluto.
- Todo debe poder desactivarse desde control parental.

## TAREA

1. GamificationModule en apps/api.
2. Schema: Streak, XP, Level, Badge, Challenge, Leaderboard (amigos).
3. Event-driven: se suscribe a eventos del dominio (sesión completada, check-in, etc.).
4. Frontend: widgets en dashboard del alumno (mobile), animaciones al subir de nivel.
5. Push notifications no-abusivas (max 2/día, configurables).

Tests:
- Streak se suma, se rompe, se congela.
- XP y nivel consistentes.
- Medalla se otorga con los criterios correctos.
- Ranking solo muestra amigos aprobados.
```

---

## Prompt 6: Marketplace de Profes Humanos

```
Implementá el marketplace de profesores humanos de ApoyoAI.

## FLUJO
- Sistema detecta que la IA no está alcanzando (ej: alumno con 3 sesiones sin progreso en el mismo tema) → sugiere clase con profe humano.
- Padre navega catálogo de profes verificados: filtros por materia, rating, precio, disponibilidad, país.
- Booking con calendario en tiempo real.
- Videollamada integrada (Daily.co o Jitsi).
- Pago via MercadoPago/Stripe, comisión 20-30%.
- Rating post-clase.

## REQUISITOS DE PROFES
- Verificación de identidad (DNI + selfie + videollamada de KYC).
- Título o experiencia comprobada.
- Antecedentes penales (obligatorio para trabajar con menores).
- Referencias.
- Aprobación manual por equipo de ops.

## FEATURES
- Perfil del profe: foto, bio, materias, precios, disponibilidad, reviews.
- Preview: primera clase de 20 min gratuita o descuento.
- Grabación opcional de clases (con consentimiento explícito, encriptado, solo accesible por padre).
- Chat pre-clase entre padre y profe (limitado a coordinación).

## TAREA

1. TutorMarketplaceModule con schema completo.
2. KYC service con integración a proveedor (Veriff, Jumio, o Didit).
3. Booking system con calendar (FullCalendar frontend).
4. Video session service con Daily.co.
5. Payment split: retención 20-30% automática.
6. Dashboard para profes: ingresos, próximas clases, reviews.
7. Sistema de disputas (clase no se dio, mala calidad): escalado a humanos.

## REGLAS
- Protección de menores: toda interacción profe-alumno dentro de la plataforma (chat, video).
- Grabación opcional pero recomendada.
- Cero contacto fuera de la plataforma (cláusula contractual).
- Seguro de responsabilidad profesional (explorar con aseguradora argentina).

Tests:
- Flujo completo: padre reserva, paga, clase se da, rating, comisión.
- Profe cancela < 24h → penalización.
- Padre cancela < 2h → sin reembolso.
- KYC incompleto → profe bloqueado.
```

---

## Prompt 7: Modo Offline + SMS

```
Implementá soporte offline-first y canal SMS para zonas sin datos.

## OFFLINE (mobile app)

### Cache
- Contenido curricular del alumno: descargado al login.
- Últimas 50 conversaciones cacheadas localmente.
- Ejercicios generados guardados para uso sin internet.

### Sincronización
- Al recuperar conexión: sync diferencial.
- Conflictos: last-write-wins con log de cambios.

### Funcionalidad offline garantizada
- Continuar lección ya empezada.
- Hacer ejercicios cacheados.
- Leer biblioteca descargada.
- Completar check-in emocional.

### Limitaciones offline claras
- No nuevas conversaciones con tutor IA (requiere internet).
- Indicadores visuales claros de qué funciona offline.

## SMS

### Casos de uso
- Alumnos en zonas rurales con celular básico sin datos.
- Recordatorios de hábito.
- Resultados de ejercicios simples.

### Flujo
- Twilio SMS gateway.
- Comandos: "EJERCICIO MATE", "AYUDA FRACCIONES", "RACHA".
- Respuestas concisas (160 chars × 3 máximo).
- Costo por mensaje → límite diario por plan.

## TAREA

1. Expo + Redux Persist + SQLite local.
2. Sync engine con detección de red.
3. SMSModule en apps/api + gateway Twilio.
4. Command parser y respuestas template.
5. Rate limiting específico para SMS.

Tests:
- App funciona en modo avión tras primer login.
- Sync correcto al reconectar.
- SMS command devuelve respuesta en < 5s.
- Abuso de SMS → bloqueo.
```

---

## Prompt 8: Integridad Académica con IA

```
Implementá el módulo de Integridad Académica.

## PROBLEMA
Los chicos usan ChatGPT/Claude para hacer la tarea. Los docentes no saben qué es IA y qué no. Prohibir no funciona. Hay que enseñar a usarla bien.

## COMPONENTES

### A) Detector (orientativo, no acusatorio)
- Análisis de texto entregado vs perfil de escritura del alumno (histórico).
- Señales: cambio abrupto de estilo, vocabulario inconsistente con nivel, estructura demasiado perfecta.
- Output: probabilidad IA-generated (0-100%) + explicación.
- **NUNCA presentar como prueba.** Solo como señal para conversar.

### B) Generador de evaluaciones "IA-proof"
- Preguntas personalizadas por alumno usando datos de su vida (anonimizados).
- Requiere razonamiento en tiempo real, no regurgitación.
- Formato oral o conversación con la IA (más difícil de copiar).
- Ejemplos:
  - "Explicá con tus palabras el error que cometiste en el ejercicio 3 de la semana pasada."
  - "Inventá un problema de regla de tres usando algo de tu materia favorita."
  - "Discutí con el tutor IA por qué tal respuesta es incorrecta."

### C) Formación en uso ético de IA
- Microcursos: "IA como compañero de estudio, no como atajo".
- Prompting pedagógico: cómo pedirle a la IA que te enseñe, no que te dé la respuesta.
- Ejercicios de detectar errores en respuestas de IA.

## TAREA

1. IntegrityModule: detector + generator + learning.
2. IA-proof question generator: toma contexto del alumno + tema + currículo → genera evaluación única.
3. Rubric scoring con IA: evaluación de respuestas abiertas con rúbrica.
4. Dashboard docente con flags orientativos.

## REGLAS ÉTICAS
- Nunca acusar a un alumno con base solo en el detector.
- Transparencia total con alumnos: "este trabajo se revisa con IA".
- Proteger falsos positivos: alumnos que escriben bien no deben ser estigmatizados.
- Política del colegio configurable: desde "IA totalmente prohibida" hasta "IA como tutor permitida con citación".

Tests:
- Texto humano nativo → baja probabilidad IA.
- Texto 100% Claude → alta probabilidad IA (con disclaimer).
- Generación de evaluación IA-proof para alumno ficticio.
```

---

## Checklist de cierre de Fase 3

- [ ] 1.000 familias pagando en ApoyoAI
- [ ] Retención mensual > 70%
- [ ] 20+ colegios en EducAI
- [ ] Portfolio activo con primera cohorte de egresados piloto
- [ ] BienestAR con protocolo de crisis probado (simulacros)
- [ ] Marketplace con 50+ profes verificados
- [ ] Modo offline funcional
- [ ] Integridad académica adoptada por al menos 5 colegios
