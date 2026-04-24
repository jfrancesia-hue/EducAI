# Fase 4 — B2G y Expansión Regional

**Duración:** 12-16 semanas
**Objetivo:** Cerrar primera licencia ministerial, lanzar módulos de detección de deserción, empleabilidad, multilingüe cultural, salud escolar y observatorio educativo.

---

## Módulos de esta fase

1. **Detección temprana de deserción escolar** (B2G)
2. **Dashboard ministerial / provincial**
3. **Empleabilidad y futuro laboral**
4. **Multilingüe cultural** (quechua, guaraní, wichí, etc.)
5. **Salud escolar integrada** (conecta con healthtech)
6. **Observatorio educativo** (datos abiertos)

---

## Prompt 1: Detección Temprana de Deserción Escolar

```
Implementá el módulo de Detección Temprana de Deserción Escolar.

## IMPACTO ESPERADO
Este módulo solo justifica licencias ministeriales de USD 500k a 2M. En LATAM, la deserción secundaria es del 30-40%. Predecirla con 3-6 meses de anticipación permite intervenciones efectivas y medibles.

## MODELO PREDICTIVO

### Features
- Asistencia (patrones, ausencias consecutivas).
- Notas (tendencia, no solo nivel absoluto).
- Participación en plataforma (caída de uso).
- Signals emocionales (del módulo BienestAR).
- Datos socioeconómicos del hogar (anonimizados).
- Historia familiar (hermanos desertores, embarazo adolescente, trabajo infantil).
- Cambios de colegio frecuentes.
- Distancia al colegio.
- Contexto del colegio (tasa histórica de deserción).

### Modelos
- Clasificador inicial: gradient boosting (XGBoost) con features engineering clásico.
- Refinamiento: red neuronal para detectar patrones complejos.
- Explicabilidad: SHAP values para explicar cada predicción a los ministerios.

### Output
- Score de riesgo por alumno (0-100).
- Factores principales que contribuyen (top 5).
- Recomendaciones de intervención priorizadas.
- Confianza de la predicción.

## INTERVENCIONES

### Protocolo automatizado
- Riesgo bajo: monitoreo.
- Riesgo medio: alerta al tutor del colegio + recursos.
- Riesgo alto: protocolo completo (llamada del tutor, visita al hogar, activación de beca, apoyo psicológico, etc.).

### Tracking de intervenciones
- Cada intervención registrada con resultado.
- Feedback loop para mejorar el modelo (RCT interno).

## TAREA TÉCNICA

1. DropoutPredictionModule en apps/api.
2. Feature engineering pipeline en Python (FastAPI subservice) o TypeScript (ml-matrix + ml-xgboost).
3. Training pipeline semanal (airflow-like con BullMQ).
4. Predicción en tiempo real cuando hay nuevos datos.
5. Dashboard con:
   - Lista de alumnos por riesgo.
   - Drill-down con factores.
   - Recomendaciones.
   - Tracking de intervenciones.
6. API B2G: export de predicciones agregadas al ministerio.

## REGLAS
- Ética: un alumno marcado como "riesgo alto" NO debe sufrir estigmatización. Datos visibles solo a personas con protocolo (tutor designado, orientador).
- Auditable: cada predicción debe poder explicarse.
- Sesgos: validar que el modelo no perjudica a minorías (análisis de fairness por género, etnia, nivel socioeconómico).
- Consentimiento: padres/tutores legales deben consentir el uso de datos para este fin.

Tests:
- Modelo entrena sobre dataset sintético.
- Predicciones coherentes con casos conocidos.
- Explicabilidad funcional (SHAP).
- Test de fairness: error similar entre grupos.
```

---

## Prompt 2: Dashboard Ministerial / Provincial

```
Implementá el Dashboard Ministerial de EducAI (apps/gov-dashboard).

## USUARIOS
Ministros, secretarios, directores de gestión educativa, equipos de planeamiento.

## VISTAS PRINCIPALES

### A) Mapa de calor provincial/nacional
- Mapa interactivo con performance educativa por departamento/municipio.
- Filtros: grado, materia, sector (público/privado), urbano/rural.
- Comparación temporal (este año vs anterior).

### B) Indicadores clave
- Cobertura (matrícula).
- Deserción predicha y real.
- Desempeño por competencias.
- Satisfacción docente.
- Adopción de la plataforma.

### C) Benchmarking
- Ranking de colegios (con cuidado ético — escalas por contexto, no absolutas).
- Comparación contra provincias vecinas, países LATAM.

### D) Evaluación de políticas
- Efecto de intervenciones implementadas (programas de becas, capacitación docente, infraestructura).
- A/B testing de políticas (cuando sea metodológicamente válido).

### E) Alertas estratégicas
- Zonas con deterioro acelerado.
- Colegios con deserción > umbral.
- Materias con brecha creciente.

## EXPORTES
- Informes en PDF para el ministro.
- Datos crudos (CSV, JSON) para equipos técnicos.
- Presentaciones automáticas (PPTX) para sesiones del gabinete.

## TAREA

1. apps/gov-dashboard (Next.js + Tremor + Recharts + Leaflet para mapas).
2. API endpoints agregados en apps/api con rate limiting alto para exports masivos.
3. Generador de informes ejecutivos con Claude (toma datos, escribe narrativa política).
4. Export a PPTX usando la skill pptx.
5. RBAC: ministro ve todo, directores ven su región.

## REGLAS
- PII de alumnos NUNCA visible en este dashboard: solo agregados.
- Auditable: cada consulta queda en log (quién vio qué cuándo).
- Diseño "executive-grade": tipografía elegante, data-ink ratio alto.
- Estabilidad visual: datos no se mueven entre sesiones.
- Cache agresivo: queries pesadas cacheadas 24hs con refresh bajo demanda.

Tests:
- Dashboard carga en < 3s con dataset grande.
- Export PDF correcto.
- Usuario sin permiso para una región → no puede acceder.
- PII no aparece en exports.
```

---

## Prompt 3: Empleabilidad y Futuro Laboral

```
Implementá el módulo Empleabilidad y Futuro Laboral.

## PARA SECUNDARIA (15-18 años)

### Orientación vocacional con IA
- Test de intereses, aptitudes, valores (base científica: Holland, Gardner).
- Conversación con IA post-test para profundizar.
- Informe con 5-10 carreras/oficios compatibles.
- Historias reales de personas en cada camino.

### Cursos técnicos actualizados
- Catálogo alineado al mercado local (NOA + LATAM):
  - Programación básica a intermedia.
  - Marketing digital y e-commerce.
  - IA aplicada (prompting, automatizaciones).
  - Oficios modernos (electricidad solar, mecatrónica, energías renovables).
  - Minería sustentable (vertical de Jorge).
  - Agritech.
  - Turismo digital.
- Formato: mooc-style, microlearning, certificado al terminar.

### Conexión con empresas
- Bolsa de trabajo regional.
- Pasantías pagas para últimos años.
- Visitas virtuales a empresas reales.
- Mentorías con profesionales.

### CV y primer trabajo
- Generador de CV con IA (toma el portfolio del alumno y genera CV).
- Simulador de entrevistas con Claude.
- Templates de emails laborales.
- Derechos laborales básicos por país.

## PARA EMPRESAS (monetización)

- Acceso a talento joven formado (pagan por match).
- Sponsorship de cursos técnicos.
- Publicación de pasantías.
- Employer branding en la plataforma.

## TAREA

1. VocationalModule con tests, informes, orientación IA.
2. TechCoursesModule con catálogo, enrollment, certificación.
3. JobBoardModule con empresas, postulaciones, matching.
4. CVGeneratorService integrado al Portfolio.
5. InterviewSimulator con Claude.

## REGLAS
- Matching transparente: alumno ve qué empresas lo buscaron.
- Sin discriminación: filtros de género, origen, discapacidad prohibidos en búsquedas.
- Empresas verificadas: KYC corporativo.
- Pasantías: cumplimiento con ley de pasantías argentina (Ley 26.427).

Tests:
- Flujo completo: alumno hace test, completa cursos, genera CV, se postula, empresa responde.
```

---

## Prompt 4: Multilingüe Cultural (Pueblos Originarios)

```
Implementá el módulo Multilingüe Cultural.

## LENGUAS OBJETIVO
- Quechua (Bolivia, Perú, NOA Argentina)
- Aymara (Bolivia, Perú)
- Guaraní (Paraguay, NEA Argentina)
- Mapuche/Mapuzungun (Patagonia)
- Wichí (Chaco)
- Qom/Toba
- Otras según demanda.

## COMPONENTES

### A) Interfaz multilingüe
- Toda la UI traducida a estas lenguas.
- Text-to-speech nativo (contratar locutores nativos, no TTS genérico).
- Speech-to-text adaptado a acentos.

### B) Contenidos co-creados
- Alianzas con comunidades originarias.
- Material pedagógico que incorpora cosmovisión, historia, saberes ancestrales.
- Validación por líderes culturales de cada comunidad.

### C) Tutor IA con competencia cultural
- Fine-tuning o RAG especializado con corpus cultural apropiado.
- Ejemplos contextualizados: matemática con trueque andino, geografía con toponimia indígena.
- Respeto a protocolos: no enseñar ceremonias sagradas sin autorización.

### D) Preservación digital
- Biblioteca de audio con ancianos relatando historias.
- Diccionarios interactivos.
- Juegos educativos en lengua nativa.

## ANGULO DE IMPACTO
- Fondos UNESCO, BID, fundaciones indígenas, Luminos Fund.
- Valor para gobiernos con comunidades originarias (Bolivia, Perú, Paraguay).

## TAREA

1. I18n extendido en packages/i18n con las lenguas objetivo.
2. CulturalContentModule con flag `community_approved`.
3. TTS/STT nativo con proveedor especializado o propio.
4. RAG con corpus cultural en pgvector.
5. Portal de comunidad: líderes validan contenidos, aportan material.

## REGLAS
- Respeto radical: nada se publica sin visto bueno de la comunidad de origen.
- Atribución: cada contenido cultural reconoce a sus fuentes.
- Revenue share: si el producto genera ingresos a partir de contenido cultural, una parte vuelve a la comunidad.
- Cero apropiación cultural.

Tests:
- UI en quechua renderiza correctamente.
- TTS en guaraní funciona.
- Flujo de validación comunitaria.
```

---

## Prompt 5: Salud Escolar Integrada

```
Implementá el módulo Salud Escolar.

## INTEGRACIÓN CON ECOSISTEMA NATIVOS
Este módulo conecta directamente con los productos healthtech de Jorge (SALUTIA, PUIS, MediAI Connect). El objetivo es que un alumno tenga un expediente único entre salud y educación, con permisos estrictos.

## FUNCIONALIDAD

### Libreta sanitaria digital
- Vacunación.
- Controles médicos anuales.
- Antecedentes relevantes para la escuela (alergias, medicamentos, necesidades especiales).
- Sincronización con sistema de salud provincial/nacional (si está disponible).

### Screenings básicos en la escuela
- Visión: test autoadministrado con tablet (tipo Snellen digital).
- Audición: test con auriculares.
- Talla y peso con registro histórico.
- Salud bucal (autorreporte + foto).

### Alertas
- Próxima vacuna vencida.
- Control médico pendiente.
- Screening con resultado que requiere derivación.

### Derivación a sistema de salud
- Integración con hospital público o prepaga.
- Turnos automáticos.
- Recordatorios.

## TAREA

1. SchoolHealthModule con schema específico.
2. Integración con APIs de SALUTIA/PUIS/MediAI Connect (asumir API REST interna).
3. Screening tools (componentes web): visión, audición, etc.
4. Alert engine con reglas configurables.
5. Appointment booking integrado.

## REGLAS
- Datos médicos nunca accesibles para docentes sin autorización explícita.
- Cumplimiento Ley 26.529 (derechos del paciente).
- Consentimiento parental explícito para cada integración.
- Menor adolescente: desde cierta edad, autonomía sobre sus datos.

Tests:
- Test de visión calcula agudeza.
- Alerta de vacuna próxima.
- Integración con health stack interno.
```

---

## Prompt 6: Observatorio Educativo (Datos Abiertos)

```
Implementá el Observatorio Educativo.

## VISIÓN
Convertir a Nativos en el referente regional de datos educativos. Plataforma pública con datos anonimizados sobre estado de la educación en LATAM.

## CONTENIDO

### Reportes trimestrales
- "Estado de la educación NOA Q1 2026".
- Análisis de tendencias.
- Casos de éxito e intervenciones efectivas.

### Datasets abiertos
- Anonimizados y agregados (k-anonymity garantizado, k≥5).
- Formatos: CSV, JSON, Parquet.
- Licencia: Creative Commons BY-SA.

### Visualizaciones interactivas
- Dashboards públicos con datos agregados.
- Comparativa país, región, LATAM.

### Herramientas para periodistas e investigadores
- API pública con rate limiting.
- Queries guiadas para no técnicos.
- Notebooks de ejemplo (Observable, Jupyter).

## IMPACTO ESTRATÉGICO
- Prensa: fuente de datos para notas educativas.
- Investigación: universidades citan a Nativos.
- Política: ministerios comparan sus datos con los del observatorio.
- Marketing orgánico gigantesco.

## TAREA

1. ObservatoryModule con pipeline de anonimización.
2. Export engine para datasets.
3. Public API (rate limited, sin auth).
4. Página pública /observatorio con dashboards.
5. Blog técnico con reportes automáticos (Claude genera narrativa + humano revisa).

## REGLAS
- Privacidad irrenunciable: k-anonymity, diferenciación, auditoría externa anual.
- Transparencia sobre metodología.
- Consentimiento: todos los usuarios ya aceptaron al registrarse (cláusula clara).
- No vender datos: acceso abierto con atribución.

Tests:
- Dataset generado cumple k-anonymity.
- API pública respeta rate limits.
- Dashboards públicos cargan sin auth.
```

---

## Checklist de cierre de Fase 4

- [ ] Primera licencia provincial firmada (USD 200k+)
- [ ] Modelo de deserción con precisión > 75% validada
- [ ] 10+ colegios con intervenciones basadas en predicciones
- [ ] Empleabilidad: 500+ alumnos con portfolio laboral
- [ ] Multilingüe activo en al menos 2 lenguas originarias
- [ ] Observatorio con primer reporte publicado y cobertura de prensa
- [ ] Expansión confirmada: Bolivia como primer país fuera de Argentina
