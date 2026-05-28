import { describe, expect, it } from "vitest";
import { queryFallback } from "./stock-query-fallback.js";

describe("queryFallback", () => {
  it("reduce un query largo a las 2 palabras significativas", () => {
    expect(queryFallback("argentine teacher whiteboard math inclusive")).toBe("argentine teacher");
  });

  it("preserva queries cortos sin cambios (el caller compara con el original)", () => {
    expect(queryFallback("teacher")).toBe("teacher");
    expect(queryFallback("teacher math")).toBe("teacher math");
  });

  it("filtra stopwords en inglés y español", () => {
    expect(queryFallback("the teacher in the math classroom of buenos aires")).toBe("teacher math");
    expect(queryFallback("los estudiantes de matematica en buenos aires")).toBe(
      "estudiantes matematica",
    );
  });

  it("descarta palabras de 1-2 caracteres", () => {
    expect(queryFallback("ai is a tool for science")).toBe("tool science");
  });
});
