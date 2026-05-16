export type EducAIPlan = "free" | "individual" | "pro" | "colegio" | "institucional";
export type ApoyoAIPlan = "free" | "basico" | "plus" | "familiar" | "intensivo";
export type Product = "educai" | "apoyoai";

export const EDUCAI_MODELS: Record<EducAIPlan, string> = {
  free: "claude-sonnet-4-5",
  individual: "claude-sonnet-4-5",
  pro: "claude-sonnet-4-5",
  colegio: "claude-sonnet-4-5",
  institucional: "claude-sonnet-4-5",
};

export const APOYOAI_MODELS: Record<ApoyoAIPlan, string> = {
  free: "claude-haiku-4-5",
  basico: "claude-haiku-4-5",
  plus: "claude-sonnet-4-5",
  familiar: "claude-sonnet-4-5",
  intensivo: "claude-sonnet-4-5",
};

export const OPENAI_AUDIO_TRANSCRIPTION_MODEL = "whisper-1";
export const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

export const EDUCAI_LIMITS = {
  free: {
    planificaciones: { total_vida: 2 },
    actividades: { total_vida: 5 },
  },
  individual: {
    planificaciones: { mensual: 10 },
    actividades: { mensual: 20 },
  },
  pro: {
    planificaciones: { mensual: 40 },
    actividades: { mensual: 80 },
  },
  colegio: {
    planificaciones_por_docente_activo: { mensual: 40 },
    actividades_por_docente_activo: { mensual: 80 },
  },
  institucional: {
    planificaciones: { mensual: null },
    actividades: { mensual: null },
  },
} as const;

export const APOYOAI_LIMITS = {
  free: {
    app_consultas: { total_vida: 10 },
    foto_ocr: { total_vida: 2 },
    whatsapp: null,
    audio: null,
  },
  basico: {
    whatsapp_texto: { diario_por_hijo: 20 },
    app_consultas: { diario: null },
    audio: null,
    foto_ocr: null,
    diagnostico: { total: 1 },
    hijos: 1,
  },
  plus: {
    whatsapp_texto: { diario_por_hijo: 60 },
    audio_wa: { semanal_por_hijo: 10 },
    foto_ocr: { semanal_por_hijo: 5 },
    app_consultas: { diario: null },
    diagnostico: { mensual_por_hijo: 1 },
    reporte_padres: { semanal: true },
    hijos: 1,
  },
  familiar: {
    whatsapp_texto: { diario_por_hijo: 25 },
    audio_wa: { semanal_por_hijo: 15 },
    foto_ocr: { semanal_por_hijo: 8 },
    app_consultas: { diario: null },
    diagnostico: { mensual_por_hijo: 1 },
    reporte_padres: { semanal: true },
    hijos: 3,
  },
  intensivo: {
    whatsapp_texto: { diario_por_hijo: 40 },
    audio_wa: { semanal_por_hijo: 20 },
    foto_ocr: { semanal_por_hijo: 12 },
    app_consultas: { diario: null },
    diagnostico: { semanal_por_hijo: 1 },
    reporte_padres: { semanal: true },
    hijos: 3,
  },
} as const;

export function normalizeEducAIPlan(plan: string | null | undefined): EducAIPlan {
  const normalized = normalizePlanKey(plan);
  switch (normalized) {
    case "individual":
    case "docente_individual":
    case "docente-individual":
    case "basic":
      return "individual";
    case "pro":
    case "premium":
    case "docente_pro":
    case "docente-pro":
      return "pro";
    case "colegio":
    case "school":
      return "colegio";
    case "institucional":
    case "institutional":
      return "institucional";
    default:
      return "free";
  }
}

export function normalizeApoyoAIPlan(plan: string | null | undefined): ApoyoAIPlan {
  const normalized = normalizePlanKey(plan);
  switch (normalized) {
    case "basico":
    case "básico":
    case "basic":
      return "basico";
    case "plus":
    case "premium":
      return "plus";
    case "familiar":
    case "family":
      return "familiar";
    case "intensivo":
    case "intensive":
      return "intensivo";
    default:
      return "free";
  }
}

export function getEducAIModelForPlan(plan: string | null | undefined): string {
  return EDUCAI_MODELS[normalizeEducAIPlan(plan)];
}

export function getApoyoAIModelForPlan(plan: string | null | undefined): string {
  return APOYOAI_MODELS[normalizeApoyoAIPlan(plan)];
}

export function getModelForProductPlan(product: Product, plan: string | null | undefined): string {
  return product === "educai" ? getEducAIModelForPlan(plan) : getApoyoAIModelForPlan(plan);
}

function normalizePlanKey(plan: string | null | undefined): string {
  return (plan ?? "free").trim().toLowerCase().replace(/\s+/g, "_");
}
