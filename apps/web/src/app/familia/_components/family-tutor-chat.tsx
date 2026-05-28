"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Bot, Loader2, Send, Sparkles, UserRound } from "lucide-react";

import { Button } from "@educai/ui";
import type { FamilyStudent } from "../../../lib/api/family-students";

type ChatMessage = {
  id: string;
  role: "family" | "tutor";
  text: string;
};

type TutorApiResponse = {
  data?: {
    reply?: string;
    safetyStatus?: string;
  };
  error?: string;
};

const SUBJECTS = [
  { value: "", label: "Detectar materia" },
  { value: "matematica", label: "Matemática" },
  { value: "lengua", label: "Lengua" },
  { value: "ciencias naturales", label: "Ciencias" },
  { value: "ingles", label: "Inglés" },
  { value: "historia", label: "Historia" },
];

const QUICK_PROMPTS = ["Explicalo más simple", "Dame un ejemplo", "Tomame una pregunta"];

function studentFullName(student: FamilyStudent) {
  return `${student.firstName} ${student.lastName}`.trim();
}

function tutorErrorMessage(status: number, code?: string) {
  if (status === 401) {
    return "La sesión expiró. Iniciá sesión de nuevo para seguir.";
  }
  if (status === 403) {
    return "Esta cuenta no tiene permiso familiar para usar el tutor.";
  }
  if (status === 429) {
    return "Hubo muchas consultas juntas. Esperá un momento y volvé a intentar.";
  }
  if (code === "api_unavailable") {
    return "El tutor no está disponible en este momento.";
  }
  return "No pudimos consultar al tutor. Reintentá en unos minutos.";
}

export function FamilyTutorChat({ students }: { students: FamilyStudent[] }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? students[0],
    [selectedStudentId, students],
  );

  async function sendMessage(text: string) {
    const cleanMessage = text.trim();
    if (!selectedStudent?.id || cleanMessage.length < 2 || isSending) {
      return;
    }

    setError("");
    setIsSending(true);
    setMessage("");
    const familyMessage: ChatMessage = {
      id: `family-${Date.now()}`,
      role: "family",
      text: cleanMessage,
    };
    setMessages((current) => [...current, familyMessage]);

    try {
      const response = await fetch("/familia/tutor/consultar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          subject: subject || undefined,
          message: cleanMessage,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as TutorApiResponse;

      if (!response.ok) {
        setError(tutorErrorMessage(response.status, payload.error));
        return;
      }

      const reply = payload.data?.reply?.trim();
      if (!reply) {
        setError("El tutor respondió vacío. Reintentá con otra consulta.");
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: `tutor-${Date.now()}`,
          role: "tutor",
          text: reply,
        },
      ]);
    } catch {
      setError("No pudimos conectar con el tutor. Revisá la conexión e intentá de nuevo.");
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(message);
  }

  return (
    <section className="rounded-lg border border-[#b7eee4] bg-[#f9fffd] shadow-whisper">
      <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="border-b border-[#d5e1dc] p-5 lg:border-b-0 lg:border-r">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#18b6a4] px-3 py-1 text-sm font-bold text-white">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Tutor web
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-[#10221e]">
            Preguntale a ApoyoAI
          </h2>
          <p className="mt-2 text-[15px] font-medium leading-7 text-[#42534d]">
            Es el mismo tutor que responde por WhatsApp, pero desde la web queda disponible con más
            margen de uso porque no consume mensajes externos.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-[#33423c]">Hijo</span>
              <select
                value={selectedStudent?.id ?? ""}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                className="h-11 rounded-lg border border-[#bcd8d1] bg-white px-3 font-semibold text-[#10221e] outline-none focus:border-[#18b6a4] focus:ring-2 focus:ring-[#18b6a4]/20"
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {studentFullName(student)} - grado {student.grade}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-[#33423c]">Materia</span>
              <select
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="h-11 rounded-lg border border-[#bcd8d1] bg-white px-3 font-semibold text-[#10221e] outline-none focus:border-[#18b6a4] focus:ring-2 focus:ring-[#18b6a4]/20"
              >
                {SUBJECTS.map((option) => (
                  <option key={option.value || "auto"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setMessage((current) => `${current.trim()} ${prompt}`.trim())}
                className="rounded-lg border border-[#bcd8d1] bg-white px-3 py-2 text-sm font-bold text-[#075c50] transition hover:border-[#18b6a4] hover:bg-[#e7fbf7]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="grid min-h-[420px] grid-rows-[1fr_auto] p-5">
          <div className="grid content-end gap-3">
            {messages.length ? (
              messages.map((chatMessage) => (
                <div
                  key={chatMessage.id}
                  className={`flex gap-3 ${
                    chatMessage.role === "family" ? "justify-end" : "justify-start"
                  }`}
                >
                  {chatMessage.role === "tutor" ? (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#18b6a4] text-white">
                      <Bot className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                  <p
                    className={`max-w-[82%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm font-semibold leading-6 ${
                      chatMessage.role === "family"
                        ? "bg-[#11231f] text-white"
                        : "border border-[#d5e1dc] bg-white text-[#24332e]"
                    }`}
                  >
                    {chatMessage.text}
                  </p>
                  {chatMessage.role === "family" ? (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#11231f] text-white">
                      <UserRound className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[#bcd8d1] bg-white p-5">
                <Bot className="h-7 w-7 text-[#18b6a4]" aria-hidden="true" />
                <p className="mt-3 text-[15px] font-semibold leading-7 text-[#42534d]">
                  Escribí una duda escolar, pedí una explicación paso a paso o pedile que practique
                  con preguntas cortas.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
            {error ? (
              <p className="rounded-lg border border-[#f0c9c9] bg-[#fff4f4] px-3 py-2 text-sm font-bold text-[#a33b3b]">
                {error}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ej: No entiendo fracciones equivalentes, explicámelo con un ejemplo."
                rows={3}
                className="min-h-24 rounded-lg border border-[#bcd8d1] bg-white px-3 py-3 font-semibold leading-6 text-[#10221e] outline-none placeholder:text-[#6c7a74] focus:border-[#18b6a4] focus:ring-2 focus:ring-[#18b6a4]/20"
              />
              <Button
                type="submit"
                disabled={isSending || message.trim().length < 2}
                className="h-12 self-end bg-[#18b6a4] px-5 text-white hover:bg-[#119b8c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                Preguntar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
