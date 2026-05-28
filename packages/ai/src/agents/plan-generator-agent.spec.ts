import { describe, expect, it, vi } from "vitest";

import { PlanGeneratorAgent, type PlanGeneratorInput } from "./plan-generator-agent.js";

const baseInput: PlanGeneratorInput = {
  educationLevel: "secundaria",
  grade: 2,
  subject: "Matematica",
  topic: "Proporcionalidad directa",
  totalDurationMinutes: 80,
  sessionCount: 1,
};

const richGuide = {
  version: "educai.lesson-guide.v1",
  generadaEn: "2026-05-27T00:00:00.000Z",
  vistaDocente: {
    titulo: "Matematica - Proporcionalidad directa",
    resumen: "Clase concreta para trabajar proporcionalidad directa con tabla, constante y ticket.",
    focoPedagogico: "Construir la constante de proporcionalidad desde ejemplos comparables.",
    productoEsperado: "Resolucion justificada de un problema de proporcionalidad directa.",
  },
  contextoClase: {
    nivel: "secundaria",
    anio: 2,
    materia: "Matematica",
    tema: "Proporcionalidad directa",
    intencion: "Practicar",
    duracionTotal: 80,
    cantidadClases: 1,
    supuestos: ["El grupo reconoce multiplicaciones y tablas simples."],
  },
  saberesClave: [
    {
      nombre: "Constante de proporcionalidad",
      explicacionSimple: "Es el numero que permite pasar de una magnitud a otra.",
      ejemploDelTema: "Si 3 cuadernos cuestan 900, cada cuaderno cuesta 300.",
      errorComun: "Sumar una cantidad fija en vez de multiplicar por la constante.",
    },
    {
      nombre: "Tabla proporcional",
      explicacionSimple: "Organiza pares de valores que mantienen la misma razon.",
      ejemploDelTema: "1 cuaderno 300, 2 cuadernos 600, 3 cuadernos 900.",
      errorComun: "Mezclar pares que no corresponden.",
    },
  ],
  objetivosAprendizaje: [
    {
      objetivo: "Resolver problemas de proporcionalidad directa.",
      evidenciaObservable: "Identifica la constante y justifica el procedimiento.",
    },
    {
      objetivo: "Comparar estrategias de resolucion.",
      evidenciaObservable: "Explica una tabla o cuenta equivalente.",
    },
  ],
  secuencia: [
    {
      claseNumero: 1,
      duracion: 80,
      momentos: [
        {
          nombre: "Apertura",
          duracion: 10,
          proposito: "Activar experiencias de compra y relacion entre cantidades.",
          consignaDocente: "Si 2 entradas cuestan 4000, cuanto costarian 5 y como lo sabes?",
          actividadEstudiantes: "Proponen estrategias y explican si sumaron o multiplicaron.",
          ejemploConcreto: "2 entradas 4000 implica 1 entrada 2000 y 5 entradas 10000.",
          intervencionDocente: "Pedir que indiquen la unidad y revisen si la razon se mantiene.",
          cierreParcial: "Nombrar la constante de proporcionalidad.",
        },
        {
          nombre: "Desarrollo",
          duracion: 55,
          proposito: "Resolver y justificar usando tablas proporcionales.",
          consignaDocente: "Completen la tabla y escriban que numero multiplica en cada caso.",
          actividadEstudiantes: "Completan tabla, resuelven un problema y justifican la constante.",
          ejemploConcreto: "Cantidad de lapices 1, 3, 6 y precio 150, 450, 900.",
          intervencionDocente: "Si suman valores fijos, pedir que prueben con el valor unitario.",
          cierreParcial: "Comparar dos resoluciones correctas.",
        },
      ],
    },
  ],
  actividadCentral: {
    titulo: "Feria de precios proporcionales",
    consignaListaParaUsar:
      "Calculen precios para diferentes cantidades, identifiquen la constante y escriban una explicacion.",
    pasos: ["Hallar valor unitario.", "Completar tabla.", "Resolver caso nuevo."],
    produccionEsperada: "Tabla completa con explicacion de la constante.",
    variantes: ["Usar tabla guiada.", "Crear un problema propio."],
  },
  materialesEditables: [
    {
      nombre: "Tabla de practica",
      contenido: "Producto, cantidad, precio total, valor unitario y explicacion.",
      comoUsarlo: "Entregar durante el desarrollo y revisar una fila en comun.",
    },
  ],
  evaluacion: {
    criterios: [
      "Identifica la constante de proporcionalidad.",
      "Justifica el procedimiento usado.",
    ],
    instrumento: "Lista de cotejo breve.",
    ticketSalida: "Explica como hallaste el precio de 7 unidades.",
    retroalimentacionSugerida: "Marcar una estrategia correcta y una mejora puntual.",
  },
  diferenciacion: {
    apoyoFuerte: "Dar tabla con primera fila resuelta y valor unitario visible.",
    grupoBase: "Resolver una tabla y justificar por escrito.",
    extension: "Crear un problema proporcional y uno que no lo sea.",
  },
  recursosDidacticos: {
    adecuacionNivel:
      "La clase usa precios y tablas adecuados para estudiantes de secundaria que ya trabajan multiplicacion.",
    recomendacionesClase: [
      "Mantener visible el valor unitario durante toda la practica.",
      "Comparar una tabla correcta con una que no mantiene la razon.",
    ],
    imagenesSugeridas: [
      {
        titulo: "Puestos de feria con precios",
        descripcion: "Imagen de productos con precios por unidad y por cantidad.",
        usoDidactico: "Usarla en la apertura para preguntar si los precios mantienen proporcion.",
        busquedaSugerida: "feria precios productos proporcionalidad",
      },
    ],
    videosSugeridos: [
      {
        titulo: "Proporcionalidad directa con tablas",
        busquedaYoutube: "proporcionalidad directa tablas secundaria",
        criterioSeleccion: "Elegir un video corto con ejemplos de valor unitario.",
        momentoUso: "Usarlo como repaso al cierre o tarea domiciliaria.",
      },
    ],
  },
  erroresFrecuentes: [
    {
      error: "Sumar una cantidad fija.",
      comoDetectarlo: "Los incrementos no mantienen la misma razon.",
      comoIntervenir: "Volver al valor unitario y comprobar multiplicando.",
    },
    {
      error: "Confundir cantidad con precio.",
      comoDetectarlo: "Intercambia columnas en la tabla.",
      comoIntervenir: "Rotular unidades y leer cada par antes de calcular.",
    },
  ],
  recursosOpcionales: ["Pizarron", "Tabla impresa"],
};

describe("PlanGeneratorAgent", () => {
  it("envia reglas pedagogicas como system prompt real", async () => {
    const generate = vi.fn().mockResolvedValue({
      content: JSON.stringify({
        ...richGuide,
      }),
      tokensUsed: 100,
      modelUsed: "test-model",
    });
    const agent = new PlanGeneratorAgent({ generate });

    await agent.generate(baseInput);

    const call = generate.mock.calls[0]?.[0];
    expect(call?.system).toEqual([
      expect.objectContaining({
        cacheable: true,
        text: expect.stringContaining("guardar_clase_docente"),
      }),
    ]);
    expect(call?.messages).toEqual([
      expect.objectContaining({
        role: "user",
        content: expect.stringContaining("completa todos los campos requeridos"),
      }),
    ]);
    expect(call?.toolChoice).toBe("guardar_clase_docente");
    expect(call?.tools?.[0]?.name).toBe("guardar_clase_docente");
  });

  it("normaliza la guia rica al contrato legacy y conserva guide", async () => {
    const agent = new PlanGeneratorAgent({
      generate: vi.fn().mockResolvedValue({
        content: "",
        toolUse: { name: "guardar_clase_docente", input: richGuide },
        tokensUsed: 100,
        modelUsed: "test-model",
      }),
    });

    const plan = await agent.generate(baseInput);

    expect(plan.guide.vistaDocente.titulo).toContain("Proporcionalidad directa");
    expect(plan.sessions[0]?.phases[0]?.activities).toEqual(
      expect.arrayContaining([expect.stringContaining("Consigna docente: Si 2 entradas cuestan")]),
    );
    expect(plan.printables[0]?.prompt).toContain("Como usarlo");
  });

  it("usa fallback editable si el proveedor IA falla", async () => {
    const agent = new PlanGeneratorAgent({
      generate: vi.fn().mockRejectedValue(new Error("provider unavailable")),
    });

    const plan = await agent.generate(baseInput);

    expect(plan.overview).toContain("Proporcionalidad directa");
    expect(plan.sessions).toHaveLength(1);
    expect(plan.assessment.instruments).toEqual(
      expect.arrayContaining([expect.stringContaining("Lista de cotejo")]),
    );
    expect(plan.guide.erroresFrecuentes).toHaveLength(2);
  });

  it("reintenta una vez si la primera llamada IA falla", async () => {
    const generate = vi
      .fn()
      .mockRejectedValueOnce(new Error("provider unavailable"))
      .mockResolvedValueOnce({
        content: "",
        toolUse: { name: "guardar_clase_docente", input: richGuide },
        tokensUsed: 100,
        modelUsed: "test-model",
      });
    const agent = new PlanGeneratorAgent({ generate });

    const result = await agent.generateWithMetadata(baseInput);

    expect(result.source).toBe("llm");
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[1]?.[0].messages[0]?.content).toContain("REINTENTO");
  });
});
