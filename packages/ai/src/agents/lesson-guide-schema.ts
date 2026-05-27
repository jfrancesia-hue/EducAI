import { z } from "zod";

const boundedText = (min = 1, max = 1200) => z.string().trim().min(min).max(max);

export const educaiLessonGuideSchema = z.object({
  version: boundedText(1, 24),
  generadaEn: boundedText(1, 40),
  vistaDocente: z.object({
    titulo: boundedText(5, 160),
    resumen: boundedText(30, 1200),
    focoPedagogico: boundedText(20, 900),
    productoEsperado: boundedText(20, 900),
  }),
  contextoClase: z.object({
    nivel: z.enum(["primaria", "secundaria", "terciario", "universitario"]),
    anio: z.number().int().min(1).max(12),
    materia: boundedText(1, 120),
    tema: boundedText(1, 180),
    intencion: boundedText(1, 120),
    duracionTotal: z.number().int().min(10).max(600),
    cantidadClases: z.number().int().min(1).max(20),
    supuestos: z.array(boundedText(5, 320)).min(1).max(6),
  }),
  saberesClave: z
    .array(
      z.object({
        nombre: boundedText(2, 120),
        explicacionSimple: boundedText(20, 800),
        ejemploDelTema: boundedText(20, 900),
        errorComun: boundedText(10, 600),
      }),
    )
    .min(2)
    .max(8),
  objetivosAprendizaje: z
    .array(
      z.object({
        objetivo: boundedText(15, 500),
        evidenciaObservable: boundedText(15, 500),
      }),
    )
    .min(2)
    .max(6),
  secuencia: z
    .array(
      z.object({
        claseNumero: z.number().int().min(1),
        duracion: z.number().int().min(10).max(240),
        momentos: z
          .array(
            z.object({
              nombre: boundedText(3, 80),
              duracion: z.number().int().min(1).max(180),
              proposito: boundedText(15, 600),
              consignaDocente: boundedText(20, 1200),
              actividadEstudiantes: boundedText(20, 1200),
              ejemploConcreto: boundedText(20, 1200),
              intervencionDocente: boundedText(20, 1200),
              cierreParcial: boundedText(15, 900),
            }),
          )
          .min(2)
          .max(6),
      }),
    )
    .min(1)
    .max(20),
  actividadCentral: z.object({
    titulo: boundedText(5, 140),
    consignaListaParaUsar: boundedText(40, 1600),
    pasos: z.array(boundedText(10, 500)).min(2).max(10),
    produccionEsperada: boundedText(20, 900),
    variantes: z.array(boundedText(10, 500)).min(1).max(5),
  }),
  materialesEditables: z
    .array(
      z.object({
        nombre: boundedText(3, 140),
        contenido: boundedText(30, 2400),
        comoUsarlo: boundedText(20, 900),
      }),
    )
    .min(1)
    .max(8),
  evaluacion: z.object({
    criterios: z.array(boundedText(15, 500)).min(2).max(8),
    instrumento: boundedText(15, 900),
    ticketSalida: boundedText(20, 900),
    retroalimentacionSugerida: boundedText(20, 900),
  }),
  diferenciacion: z.object({
    apoyoFuerte: boundedText(20, 900),
    grupoBase: boundedText(20, 900),
    extension: boundedText(20, 900),
  }),
  erroresFrecuentes: z
    .array(
      z.object({
        error: boundedText(10, 400),
        comoDetectarlo: boundedText(15, 700),
        comoIntervenir: boundedText(15, 900),
      }),
    )
    .min(2)
    .max(8),
  recursosOpcionales: z.array(boundedText(3, 240)).min(1).max(10),
});

export type EducaiLessonGuide = z.infer<typeof educaiLessonGuideSchema>;
