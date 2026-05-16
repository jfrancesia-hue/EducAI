import { Injectable } from "@nestjs/common";
import type { ResolvedStudent } from "./student-resolver.service.js";

export type SlashCommand = "ayuda" | "examen" | "ejercicio" | "pausar" | "empezar";

export interface CommandResult {
  command: SlashCommand;
  reply: string;
  /** Sugerencia para el orchestrator: terminar la conversación activa */
  closeConversation?: boolean;
  /** El siguiente mensaje del alumno será tomado como inicio de modo examen */
  enterExamMode?: boolean;
  /** Solicita un nuevo ejercicio sobre la materia y dificultad ya conocidas */
  requestPracticeExercise?: boolean;
}

const COMMAND_PATTERN = /^\s*\/([a-zñáéíóú]+)\b/i;

function buildReply(command: SlashCommand, name: string): string {
  switch (command) {
    case "ayuda":
      return [
        `Hola ${name}, soy Mica, tu tutora de ApoyoAI. Te paso lo que puedo hacer:`,
        "",
        "📚 Mandame una pregunta de matemática, lengua o ciencias y te acompaño paso a paso.",
        "📷 Sacale foto a un ejercicio y mandala — la leo y arrancamos.",
        "🎤 Mandame un audio si te resulta más fácil hablar que escribir.",
        "",
        "Comandos:",
        "/empezar — comenzar diagnóstico inicial",
        "/ejercicio — pedime un ejercicio nuevo de práctica",
        "/examen — entrar en modo examen para repasar",
        "/pausar — cerrar la conversación actual",
        "/ayuda — ver este menú",
      ].join("\n");
    case "empezar":
      return `¡Hola ${name}! Antes de arrancar voy a hacerte algunas preguntas cortas para conocerte mejor (te toma 10 minutos). Después armamos el plan juntos. ¿Listos? Respondé "sí" para empezar.`;
    case "ejercicio":
      return `Dale ${name}, te preparo un ejercicio nuevo de práctica sobre lo último que estuvimos viendo. Ya te lo mando — contame qué intentás antes de mostrarme el resultado.`;
    case "examen":
      return `Entramos en modo examen 📝. Voy a hacerte 5 preguntas seguidas sobre la materia, sin pistas. Al final repasamos juntos. ¿Te animás? Respondé "sí" para arrancar.`;
    case "pausar":
      return `Listo ${name}, paramos por hoy. Cuando quieras seguir, simplemente mandame un mensaje y retomamos. ¡Buen descanso! 👋`;
  }
}

/**
 * Detecta y maneja los comandos slash que el alumno puede mandar por WhatsApp.
 *
 * Las respuestas son determinísticas (no llaman al LLM) para que sean rápidas
 * y predecibles. Los comandos también devuelven flags semánticos que el
 * orchestrator usa para cambiar el estado de la conversación.
 */
@Injectable()
export class CommandHandlerService {
  detect(messageBody: string): SlashCommand | null {
    const match = COMMAND_PATTERN.exec(messageBody);
    if (!match) {
      return null;
    }
    const raw = match[1]?.toLowerCase();
    switch (raw) {
      case "ayuda":
      case "help":
        return "ayuda";
      case "empezar":
      case "start":
        return "empezar";
      case "ejercicio":
      case "practica":
      case "práctica":
        return "ejercicio";
      case "examen":
      case "repaso":
        return "examen";
      case "pausar":
      case "pausa":
      case "parar":
      case "stop":
        return "pausar";
      default:
        return null;
    }
  }

  handle(command: SlashCommand, student: ResolvedStudent): CommandResult {
    const reply = buildReply(command, student.studentName);

    switch (command) {
      case "pausar":
        return { command, reply, closeConversation: true };
      case "examen":
        return { command, reply, enterExamMode: true };
      case "ejercicio":
        return { command, reply, requestPracticeExercise: true };
      case "ayuda":
      case "empezar":
      default:
        return { command, reply };
    }
  }
}
