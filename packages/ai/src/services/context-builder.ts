export interface StudentLearningContext {
  studentName: string;
  grade: number;
  subject: string;
  learningStyle?: string;
  recentHistory?: string[];
  curriculumSnippets?: string[];
}

export class ContextBuilder {
  build(input: StudentLearningContext): string {
    const recentHistory = input.recentHistory?.slice(-8).join("\n") ?? "";
    const curriculum = input.curriculumSnippets?.slice(0, 5).join("\n") ?? "";

    return [
      `Alumno: ${input.studentName}`,
      `Grado: ${input.grade}`,
      `Materia: ${input.subject}`,
      `Estilo: ${input.learningStyle ?? "no informado"}`,
      recentHistory ? `Historial:\n${recentHistory}` : "",
      curriculum ? `Curriculo relevante:\n${curriculum}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }
}

