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

describe("PlanGeneratorAgent", () => {
  it("envia reglas pedagogicas como system prompt real", async () => {
    const generate = vi.fn().mockResolvedValue({
      content: JSON.stringify({
        overview: "Plan concreto sobre proporcionalidad directa.",
        objectives: ["Resolver problemas de proporcionalidad directa."],
        competences: ["modelizacion", "argumentacion"],
        sessions: [
          {
            number: 1,
            duration: 80,
            phases: [
              {
                name: "Apertura",
                duration: 10,
                activities: ["Responder una pregunta exacta sobre razones equivalentes."],
              },
            ],
            resources: ["Pizarron"],
            differentiation: {
              low: "Tabla guiada.",
              medium: "Problema base.",
              high: "Crear una variante.",
            },
          },
        ],
        assessment: {
          rubric: ["Explica la constante de proporcionalidad con evidencia."],
          instruments: ["Ticket de salida"],
        },
        printables: [{ name: "Guia", prompt: "Tres problemas graduados." }],
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
        text: expect.stringContaining("Devolve solo JSON valido"),
      }),
    ]);
    expect(call?.messages).toEqual([
      expect.objectContaining({
        role: "user",
        content: expect.stringContaining("Shape obligatorio"),
      }),
    ]);
  });

  it("usa fallback editable si el proveedor IA falla", async () => {
    const agent = new PlanGeneratorAgent({
      generate: vi.fn().mockRejectedValue(new Error("provider unavailable")),
    });

    const plan = await agent.generate(baseInput);

    expect(plan.overview).toContain("Proporcionalidad directa");
    expect(plan.sessions).toHaveLength(1);
    expect(plan.assessment.instruments).toContain("Lista de cotejo");
  });
});
