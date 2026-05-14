import { describe, expect, it } from "vitest";
import { InstitutionalIntentService } from "./institutional-intent.service.js";

describe("InstitutionalIntentService", () => {
  const service = new InstitutionalIntentService();

  it("detecta consultas institucionales por pagos", () => {
    const result = service.detect("Quiero saber si la cuota vence hoy");
    expect(result.channel).toBe("institutional");
    expect(result.confidence).toBe("medium");
  });

  it("detecta consultas académicas por contenido escolar", () => {
    const result = service.detect("No entiendo las fracciones equivalentes");
    expect(result.channel).toBe("academic");
  });
});
