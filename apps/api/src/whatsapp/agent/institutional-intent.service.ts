import { Injectable } from "@nestjs/common";

export interface InstitutionalIntent {
  channel: "academic" | "institutional";
  confidence: "high" | "medium" | "low";
  reasons: string[];
}

const INSTITUTIONAL_PATTERNS = [
  /\b(cuota|cuotas|pago|pagos|factura|facturas|abono|vencimiento|deuda|arancel)\b/i,
  /\b(horario|horarios|clase|clases|turno|turnos|cronograma|agenda)\b/i,
  /\b(inscrip|matr[ií]cula|vacante|vacantes|colegio|escuela|curso|docente|profesor)\b/i,
  /\b(bolet[ií]n|nota|notas|asistencia|inasistencia|diagn[oó]stico|progreso|reporte)\b/i,
  /\b(humano|asesor|persona|secretar[ií]a|administraci[oó]n|soporte)\b/i,
];

const ACADEMIC_PATTERNS = [
  /\b(sumar|restar|multiplicar|dividir|fracci[oó]n|ecuaci[oó]n|geometr[ií]a|matem[aá]tica)\b/i,
  /\b(texto|verbo|sujeto|predicado|lengua|literatura|poes[ií]a)\b/i,
  /\b(c[eé]lula|f[ií]sica|qu[ií]mica|biolog[ií]a|ciencias?)\b/i,
];

@Injectable()
export class InstitutionalIntentService {
  detect(message: string): InstitutionalIntent {
    const normalized = message.trim();
    if (!normalized) {
      return { channel: "academic", confidence: "low", reasons: ["empty_message"] };
    }

    const institutionalReasons = INSTITUTIONAL_PATTERNS.filter((pattern) =>
      pattern.test(normalized),
    ).map((_, index) => `institutional_pattern_${index + 1}`);
    const academicReasons = ACADEMIC_PATTERNS.filter((pattern) => pattern.test(normalized)).map(
      (_, index) => `academic_pattern_${index + 1}`,
    );

    if (institutionalReasons.length > academicReasons.length) {
      return {
        channel: "institutional",
        confidence: institutionalReasons.length > 1 ? "high" : "medium",
        reasons: institutionalReasons,
      };
    }

    return {
      channel: "academic",
      confidence: academicReasons.length > 0 ? "medium" : "low",
      reasons: academicReasons.length > 0 ? academicReasons : ["default_academic"],
    };
  }
}
