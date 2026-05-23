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
