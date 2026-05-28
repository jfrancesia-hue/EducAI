import { describe, expect, it, vi } from "vitest";
import { InstitutionalToolsService } from "./institutional-tools.service.js";
import type { ResolvedStudent } from "../tutor/student-resolver.service.js";

const STUDENT: ResolvedStudent = {
  studentId: "stu_1",
  studentName: "Mateo",
  grade: 5,
  studentProfileId: "prof_1",
  whatsappPhone: "+5493815550202",
  replyWhatsappPhone: "+5493815550202",
  contactRole: "PARENT",
  preferredChannel: "whatsapp",
  learningStyle: null,
  diagnosticCompleted: false,
  familyId: "fam_1",
  tenantId: "tnt_1",
  subscription: {
    id: "sub_1",
    plan: "PREMIUM",
    status: "ACTIVE",
    currentPeriodEnd: new Date("2030-01-01"),
  },
};

const MESSAGES = [
  {
    role: "tutor",
    content: "Vamos a repasar las fracciones equivalentes desde lo concreto.",
    createdAt: new Date("2026-05-28T10:30:00Z"),
  },
  {
    role: "student",
    content: "Profe, no entiendo nada de lo que me explicaron ayer, me siento mal",
    createdAt: new Date("2026-05-28T10:25:00Z"),
  },
  {
    role: "tutor",
    content: "Genial, contame qué fue lo último que repasaron en clase.",
    createdAt: new Date("2026-05-27T18:00:00Z"),
  },
  {
    role: "student",
    content: "Me peleé con mi mejor amiga y no quiero ir mañana al cole",
    createdAt: new Date("2026-05-27T17:55:00Z"),
  },
];

function buildPrisma(messagesOverride: typeof MESSAGES = MESSAGES) {
  return {
    studentProfile: {
      findUnique: vi.fn().mockResolvedValue({
        student: { school: { id: "sch_1", name: "Colegio Demo" } },
      }),
    },
    message: {
      findMany: vi.fn().mockResolvedValue(messagesOverride),
    },
  } as never;
}

// Mensaje que dispara recent_activity (matchea /progreso/ via PROGRESS_PATTERN).
const TRIGGER = "¿cómo viene el progreso de Mateo?";

describe("InstitutionalToolsService recent_activity", () => {
  it("nunca expone el contenido textual de los mensajes en el payload", async () => {
    const service = new InstitutionalToolsService(buildPrisma());
    const results = await service.collectForMessage(STUDENT, TRIGGER);

    const activity = results.find((result) => result.tool === "recent_activity");
    expect(activity).toBeDefined();
    const serialized = JSON.stringify(activity?.payload);

    // Defensa contra regresión: ningún fragmento del contenido íntimo del alumno
    // debe poder ser leído desde el payload del tool. Si alguien re-agrega `content`
    // accidentalmente, este test falla.
    expect(serialized).not.toContain("no entiendo nada");
    expect(serialized).not.toContain("me peleé");
    expect(serialized).not.toContain("fracciones");
  });

  it("entrega solo metadata agregada al adulto", async () => {
    const service = new InstitutionalToolsService(buildPrisma());
    const results = await service.collectForMessage(STUDENT, TRIGGER);
    const activity = results.find((result) => result.tool === "recent_activity");

    expect(activity?.payload).toEqual({
      totalMessages: 4,
      studentMessages: 2,
      tutorMessages: 2,
      lastInteractionAt: "2026-05-28T10:30:00.000Z",
      firstInteractionAt: "2026-05-27T17:55:00.000Z",
    });
  });

  it("maneja correctamente la ausencia de mensajes", async () => {
    const service = new InstitutionalToolsService(buildPrisma([]));
    const results = await service.collectForMessage(STUDENT, TRIGGER);
    const activity = results.find((result) => result.tool === "recent_activity");

    expect(activity?.payload).toEqual({
      totalMessages: 0,
      studentMessages: 0,
      tutorMessages: 0,
      lastInteractionAt: null,
      firstInteractionAt: null,
    });
  });
});
