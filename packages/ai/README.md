# @educai/ai

Paquete compartido para agentes pedagogicos de EducAI y ApoyoAI.

## Incluye

- `TutorAgent`: tutor socratico para estudiantes.
- `ContentFilter`: deteccion de crisis, bullying, jailbreaks y lenguaje inapropiado.
- `DiagnosticService`: evaluacion inicial adaptativa.
- `PlanGeneratorAgent`: generador de planificaciones docentes.
- `CurriculumAnalyzerAgent`: diagnostico curricular institucional.

Los clientes LLM se inyectan por interfaz para poder usar Claude/OpenAI en produccion y clientes deterministas en tests.

