export interface DiagnosticQuestion {
  id: string;
  subject: string;
  grade: number;
  prompt: string;
  options?: string[];
  expectedCompetence: string;
  difficulty: "low" | "medium" | "high";
}

export interface DiagnosticAnswer {
  questionId: string;
  answer: string;
  correct: boolean;
}

export interface DiagnosticState {
  studentProfileId: string;
  currentDifficulty: "low" | "medium" | "high";
  answers: DiagnosticAnswer[];
  completed: boolean;
}

export class DiagnosticService {
  start(studentProfileId: string): DiagnosticState {
    return {
      studentProfileId,
      currentDifficulty: "medium",
      answers: [],
      completed: false,
    };
  }

  nextQuestion(state: DiagnosticState, grade: number): DiagnosticQuestion | null {
    if (state.answers.length >= 15 || state.completed) {
      return null;
    }

    const subject = ["matematica", "lengua", "ciencias naturales"][state.answers.length % 3] ?? "matematica";

    return {
      id: `${state.studentProfileId}-${state.answers.length + 1}`,
      subject,
      grade,
      prompt: buildPrompt(subject, grade, state.currentDifficulty),
      options: ["A", "B", "C", "D"],
      expectedCompetence: "aplicacion",
      difficulty: state.currentDifficulty,
    };
  }

  registerAnswer(state: DiagnosticState, answer: DiagnosticAnswer): DiagnosticState {
    const answers = [...state.answers, answer];
    const recent = answers.slice(-3);
    const successRate = recent.filter((item) => item.correct).length / recent.length;

    return {
      ...state,
      answers,
      currentDifficulty: successRate > 0.75 ? "high" : successRate < 0.4 ? "low" : "medium",
      completed: answers.length >= 15,
    };
  }

  summarize(state: DiagnosticState) {
    const correct = state.answers.filter((answer) => answer.correct).length;

    return {
      totalQuestions: state.answers.length,
      correct,
      score: state.answers.length === 0 ? 0 : correct / state.answers.length,
      strengths: correct >= state.answers.length * 0.7 ? ["comprension general"] : [],
      opportunities: correct < state.answers.length * 0.7 ? ["practica guiada", "confianza"] : [],
    };
  }
}

function buildPrompt(subject: string, grade: number, difficulty: DiagnosticQuestion["difficulty"]): string {
  return `Pregunta ${difficulty} de ${subject} para grado ${grade}: elegi la opcion que mejor resuelve una situacion cotidiana.`;
}

