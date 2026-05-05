import { describe, expect, it, vi } from "vitest";
import { DiagnosticService } from "./diagnostic.service.js";
import type { LlmClient, LlmGenerateOutput } from "../llm/types.js";

/**
 * LLM mock que genera preguntas determinísticas con shape JSON correcto y devuelve
 * informe final con shape esperado. Útil para tests sin red.
 */
function buildScriptedLlm(): LlmClient {
  let questionCounter = 0;
  return {
    generate: vi.fn((input): Promise<LlmGenerateOutput> => {
      const userPrompt = input.messages[0]?.content ?? "";
      if (userPrompt.includes("informe")) {
        return Promise.resolve({
          content: JSON.stringify({
            strengths: ["lectura", "perseverancia"],
            opportunities: ["operaciones con fracciones"],
            recommendations: ["practicar 10 min/día con casos cotidianos"],
            inferredLearningStyle: "visual",
            narrative: "Tu hijo viene aprendiendo bien y tiene mucho para crecer en matemática.",
          }),
          tokensUsed: 200,
          modelUsed: "claude-opus-4-7",
        });
      }
      questionCounter += 1;
      const correctAnswer = ["A", "B", "C", "D"][questionCounter % 4]!;
      return Promise.resolve({
        content: JSON.stringify({
          prompt: `Pregunta de prueba número ${questionCounter}`,
          options: [
            "Opción A de prueba",
            "Opción B de prueba",
            "Opción C de prueba",
            "Opción D de prueba",
          ],
          correctAnswer,
          expectedCompetence: "comprension",
        }),
        tokensUsed: 150,
        modelUsed: "claude-opus-4-7",
      });
    }),
  };
}

/**
 * "Alumno simulado": responde correctamente con la prob. dada. Para perfil bajo
 * raramente acierta, perfil medio mitad, perfil alto casi siempre.
 */
function simulateStudent(successRate: number, correctAnswer: string): string {
  return Math.random() < successRate ? correctAnswer : pickWrong(correctAnswer);
}

function pickWrong(correctAnswer: string): string {
  const others = ["A", "B", "C", "D"].filter((l) => l !== correctAnswer);
  return others[Math.floor(Math.random() * others.length)] ?? "A";
}

describe("DiagnosticService", () => {
  it("start retorna estado inicial con grade y dificultad medium", () => {
    const service = new DiagnosticService();
    const state = service.start("prof_1", 5);

    expect(state.studentProfileId).toBe("prof_1");
    expect(state.grade).toBe(5);
    expect(state.currentDifficulty).toBe("medium");
    expect(state.questions).toHaveLength(0);
    expect(state.answers).toHaveLength(0);
    expect(state.completed).toBe(false);
  });

  it("nextQuestion devuelve null si ya hay 15 preguntas", async () => {
    const service = new DiagnosticService({ llm: buildScriptedLlm() });
    const state = service.start("prof_1", 5);
    state.questions = Array.from({ length: 15 }, (_, i) => ({
      id: `q${i}`,
      subject: "matematica",
      grade: 5,
      prompt: "stub",
      options: ["A", "B", "C", "D"],
      correctAnswer: "A",
      expectedCompetence: "comprension",
      difficulty: "medium",
    }));

    const next = await service.nextQuestion(state);
    expect(next).toBeNull();
  });

  it("nextQuestion genera pregunta con LLM, sin exponer correctAnswer", async () => {
    const service = new DiagnosticService({ llm: buildScriptedLlm() });
    const state = service.start("prof_1", 5);

    const question = await service.nextQuestion(state);

    expect(question).not.toBeNull();
    expect(question?.options).toHaveLength(4);
    expect(question).not.toHaveProperty("correctAnswer");
    // El state SÍ guarda la respuesta correcta
    expect(state.questions[0]?.correctAnswer).toMatch(/^[ABCD]$/);
  });

  it("registerAnswer marca correcto/incorrecto comparando contra state.questions", async () => {
    const service = new DiagnosticService({ llm: buildScriptedLlm() });
    const state = service.start("prof_1", 5);
    const question = await service.nextQuestion(state);
    const correctAnswer = state.questions[0]?.correctAnswer ?? "A";

    const updated = service.registerAnswer(state, question!.id, correctAnswer);

    expect(updated.answers[0]?.correct).toBe(true);
    expect(updated.answers[0]?.answer).toBe(correctAnswer);
  });

  it("registerAnswer ajusta dificultad según success rate de últimas 3", async () => {
    const service = new DiagnosticService({ llm: buildScriptedLlm() });
    let state = service.start("prof_1", 5);

    // Genera 4 preguntas y respondé las 3 primeras CORRECTAMENTE
    for (let i = 0; i < 4; i++) {
      await service.nextQuestion(state);
    }

    for (let i = 0; i < 3; i++) {
      const correct = state.questions[i]?.correctAnswer ?? "A";
      state = service.registerAnswer(state, state.questions[i]!.id, correct);
    }

    expect(state.currentDifficulty).toBe("high");
  });

  it("perfil ALTO (90% acierto) converge a dificultad high y score alto", async () => {
    const service = new DiagnosticService({ llm: buildScriptedLlm() });
    let state = service.start("prof_high", 10);

    for (let i = 0; i < 15; i++) {
      const question = await service.nextQuestion(state);
      if (!question) break;
      const correct = state.questions[i]?.correctAnswer ?? "A";
      const answer = simulateStudent(0.9, correct);
      state = service.registerAnswer(state, question.id, answer);
    }

    expect(state.completed).toBe(true);
    const summary = await service.summarize(state);
    expect(summary.score).toBeGreaterThan(0.7);
    expect(state.currentDifficulty).toBe("high");
  });

  it("perfil BAJO (10% acierto) converge a dificultad low y score bajo", async () => {
    const service = new DiagnosticService({ llm: buildScriptedLlm() });
    let state = service.start("prof_low", 7);

    for (let i = 0; i < 15; i++) {
      const question = await service.nextQuestion(state);
      if (!question) break;
      const correct = state.questions[i]?.correctAnswer ?? "A";
      const answer = simulateStudent(0.1, correct);
      state = service.registerAnswer(state, question.id, answer);
    }

    const summary = await service.summarize(state);
    expect(summary.score).toBeLessThan(0.3);
    expect(state.currentDifficulty).toBe("low");
  });

  it("perfil MEDIO (50% acierto) termina con score medio", async () => {
    const service = new DiagnosticService({ llm: buildScriptedLlm() });
    let state = service.start("prof_mid", 8);

    for (let i = 0; i < 15; i++) {
      const question = await service.nextQuestion(state);
      if (!question) break;
      const correct = state.questions[i]?.correctAnswer ?? "A";
      const answer = simulateStudent(0.5, correct);
      state = service.registerAnswer(state, question.id, answer);
    }

    const summary = await service.summarize(state);
    expect(summary.score).toBeGreaterThan(0.2);
    expect(summary.score).toBeLessThan(0.8);
  });

  it("registerAnswer lanza error si questionId no existe", () => {
    const service = new DiagnosticService({ llm: buildScriptedLlm() });
    const state = service.start("prof_1", 5);

    expect(() => service.registerAnswer(state, "q-fantasma", "A")).toThrow();
  });

  it("summarize devuelve report con estructura completa", async () => {
    const service = new DiagnosticService({ llm: buildScriptedLlm() });
    let state = service.start("prof_1", 5);

    for (let i = 0; i < 6; i++) {
      const question = await service.nextQuestion(state);
      if (!question) break;
      const correct = state.questions[i]?.correctAnswer ?? "A";
      state = service.registerAnswer(state, question.id, correct);
    }

    const summary = await service.summarize(state);

    expect(summary.totalQuestions).toBe(6);
    expect(summary.bySubject).toHaveProperty("matematica");
    expect(summary.bySubject).toHaveProperty("lengua");
    expect(summary.bySubject).toHaveProperty("ciencias naturales");
    expect(summary.byCompetence).toHaveProperty("comprension");
    expect(summary.strengths.length).toBeGreaterThan(0);
    expect(summary.recommendations.length).toBeGreaterThan(0);
    expect(summary.narrative).toBeTruthy();
  });

  it("state es serializable y deserializable (persistir en DB)", async () => {
    const service = new DiagnosticService({ llm: buildScriptedLlm() });
    let state = service.start("prof_1", 5);
    const q = await service.nextQuestion(state);
    state = service.registerAnswer(state, q!.id, state.questions[0]?.correctAnswer ?? "A");

    const json = JSON.stringify(state);
    const restored = JSON.parse(json);

    expect(restored.studentProfileId).toBe(state.studentProfileId);
    expect(restored.questions).toHaveLength(state.questions.length);
    expect(restored.answers).toHaveLength(state.answers.length);
  });

  it("fallback a pregunta determinística si el LLM devuelve JSON inválido", async () => {
    const brokenLlm: LlmClient = {
      generate: vi.fn().mockResolvedValue({
        content: "no soy json valido lol",
        tokensUsed: 10,
        modelUsed: "x",
      }),
    };
    const service = new DiagnosticService({ llm: brokenLlm });
    const state = service.start("prof_1", 5);

    const question = await service.nextQuestion(state);

    expect(question).not.toBeNull();
    expect(question?.options).toHaveLength(4);
    expect(state.questions[0]?.correctAnswer).toMatch(/^[ABCD]$/);
  });
});
