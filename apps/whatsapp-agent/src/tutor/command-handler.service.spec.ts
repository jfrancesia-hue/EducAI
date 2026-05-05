import { describe, expect, it } from "vitest";
import { CommandHandlerService } from "./command-handler.service.js";
import type { ResolvedStudent } from "./student-resolver.service.js";

const STUDENT: ResolvedStudent = {
  studentId: "stu_1",
  studentName: "Mateo",
  grade: 5,
  studentProfileId: "prof_1",
  whatsappPhone: "+5493815550202",
  preferredChannel: "whatsapp",
  learningStyle: "visual",
  diagnosticCompleted: false,
  familyId: "fam_1",
  tenantId: "tnt_1",
  subscription: {
    id: "sub_1",
    plan: "PREMIUM",
    status: "ACTIVE",
    currentPeriodEnd: new Date(),
  },
};

describe("CommandHandlerService", () => {
  const service = new CommandHandlerService();

  describe("detect", () => {
    it("detecta /ayuda con espacio inicial", () => {
      expect(service.detect("  /ayuda")).toBe("ayuda");
    });

    it("acepta alias /help", () => {
      expect(service.detect("/help")).toBe("ayuda");
    });

    it("detecta /pausar y aliases", () => {
      expect(service.detect("/pausar")).toBe("pausar");
      expect(service.detect("/parar")).toBe("pausar");
      expect(service.detect("/stop")).toBe("pausar");
    });

    it("detecta /examen", () => {
      expect(service.detect("/examen")).toBe("examen");
      expect(service.detect("/repaso")).toBe("examen");
    });

    it("detecta /ejercicio", () => {
      expect(service.detect("/ejercicio")).toBe("ejercicio");
      expect(service.detect("/practica")).toBe("ejercicio");
      expect(service.detect("/práctica")).toBe("ejercicio");
    });

    it("retorna null si no hay slash", () => {
      expect(service.detect("hola Mica")).toBeNull();
    });

    it("retorna null para comandos desconocidos", () => {
      expect(service.detect("/random")).toBeNull();
    });
  });

  describe("handle", () => {
    it("/ayuda incluye nombre del alumno y los comandos disponibles", () => {
      const result = service.handle("ayuda", STUDENT);
      expect(result.reply).toContain("Mateo");
      expect(result.reply).toContain("/empezar");
      expect(result.reply).toContain("/pausar");
      expect(result.closeConversation).toBeUndefined();
    });

    it("/pausar marca closeConversation", () => {
      const result = service.handle("pausar", STUDENT);
      expect(result.closeConversation).toBe(true);
      expect(result.reply).toContain("Mateo");
    });

    it("/examen marca enterExamMode", () => {
      const result = service.handle("examen", STUDENT);
      expect(result.enterExamMode).toBe(true);
    });

    it("/ejercicio marca requestPracticeExercise", () => {
      const result = service.handle("ejercicio", STUDENT);
      expect(result.requestPracticeExercise).toBe(true);
    });
  });
});
