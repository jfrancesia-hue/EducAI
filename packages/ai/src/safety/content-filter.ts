export type SafetyStatus = "safe" | "monitor" | "escalate";

export type SafetySignal =
  | "crisis_suicide"
  | "crisis_self_harm"
  | "crisis_abuse"
  | "crisis_violence"
  | "harassment_bullying"
  | "frustration"
  | "confusion"
  | "direct_answer_request"
  | "instruction_override"
  | "off_topic"
  | "inappropriate_language"
  | "sexual_content"
  | "drugs_alcohol";

export interface ContentSafetyResult {
  status: SafetyStatus;
  signals: SafetySignal[];
  blocked: boolean;
  /**
   * Solo presente cuando hay señal de crisis. La orquestación debe disparar
   * notificación al padre por email y derivar al alumno a recurso humano.
   */
  crisisAlert?: {
    severity: "high" | "critical";
    recommendation: string;
    helplines: string[];
  };
}

interface PatternRule {
  signal: SafetySignal;
  patterns: RegExp[];
}

// Patrones en español rioplatense + neutro. Incluye lunfardo y formas
// que efectivamente usan adolescentes argentinos.
const PATTERN_RULES: PatternRule[] = [
  {
    signal: "crisis_suicide",
    patterns: [
      /\bme\s+quiero\s+matar\b/i,
      /\bquiero\s+morir(me)?\b/i,
      /\bsuicid/i,
      /\bno\s+quiero\s+(seguir\s+)?vivir\b/i,
      /\bme\s+voy\s+a\s+(matar|tirar)\b/i,
      /\b(pensar|pienso)\s+en\s+matarme\b/i,
    ],
  },
  {
    signal: "crisis_self_harm",
    patterns: [
      /\bautoles/i,
      /\bme\s+cort[oé]/i,
      /\bme\s+lastim[oé]/i,
      /\bme\s+hago\s+da[ñn]o/i,
      /\bme\s+(quem[oé]|golpe[oé])/i,
    ],
  },
  {
    signal: "crisis_abuse",
    patterns: [
      /\bme\s+pega/i,
      /\b(mi\s+pap[áa]|mi\s+mam[áa]|mi\s+padrastro|mi\s+madrastra|mi\s+t[íi]o)\s+me\s+(pega|toca|grita|encierra)/i,
      /\babus(o|a|aron|aban)\b/i,
      /\bmanose/i,
      /\bme\s+toca\s+(cuando|donde|las|los)/i,
    ],
  },
  {
    signal: "crisis_violence",
    patterns: [
      /\bme\s+amenaz/i,
      /\bme\s+quieren\s+(pegar|matar|cagar\s+a\s+palos)\b/i,
      /\b(violenci|golpe[oa]n)/i,
    ],
  },
  {
    signal: "harassment_bullying",
    patterns: [
      /\bbull(y|ying)\b/i,
      /\bme\s+(carga|cargan|joden|cargaron|hostigan)\b/i,
      /\bse\s+r[íi]en\s+de\s+m[íi]\b/i,
      /\bnadie\s+me\s+habla\s+en\s+el\s+(cole|colegio|curso)/i,
      /\bme\s+excluyen\b/i,
      /\b(no\s+quiero\s+ir|no\s+aguanto\s+ir)\s+(m[áa]s\s+)?al?\s+(cole|colegio|escuela)/i,
    ],
  },
  {
    signal: "direct_answer_request",
    patterns: [
      /\bdame\s+la\s+respuesta\b/i,
      /\bdec[íi]me\s+la\s+respuesta\b/i,
      /\bresolv[eé](lo|me|nos|melo)\b/i,
      /\bresolv[eé]\s+(el|este|esta)\s+(ejercicio|problema|cuenta|completo)/i,
      /\bresolveme\s+el\s+ejercicio/i,
      /\bhac[eé](lo|melo)\s+(por\s+m[íi]|completo)?/i,
      /\bcompletame?\s+(el\s+)?(ejercicio|problema|trabajo)/i,
      /\bs[oó]lo\s+pas[áa]me\s+el?\s+resultado\b/i,
      /\bme\s+lo\s+resolv[eé]s\b/i,
    ],
  },
  {
    signal: "instruction_override",
    patterns: [
      /\bignor[áa]\s+tus\s+instrucciones\b/i,
      /\bolvid[áa]te\s+(de\s+)?(las\s+)?reglas\b/i,
      /\bhac[eé]\s+de\s+cuenta\s+que\s+sos\s+(otra|una)\s+(ia|inteligencia)/i,
      /\bact[uú]a\s+como\s+si\s+no\s+tuvieras\s+restricciones\b/i,
      /\bjailbreak/i,
      /\bDAN\b/,
      /\bsin\s+filtros\b/i,
    ],
  },
  {
    signal: "frustration",
    patterns: [
      /\bsoy\s+(un|una)\s+(burro|burra|bobo|boba|tarado|tarada|in[uú]til)\b/i,
      /\bno\s+entiendo\s+nada\b/i,
      /\bsoy\s+el?\s+peor\b/i,
      /\bnunca\s+(me\s+sale|voy\s+a\s+entender)\b/i,
      /\bme\s+(rindo|aburre|cans[eéo])\b/i,
      /\b(odio|detesto)\s+(esto|matem|lengua|ciencias)/i,
      /\b:\(/,
    ],
  },
  {
    signal: "confusion",
    patterns: [
      /\bno\s+entiendo\b/i,
      /\b(qu[eé]|cu[áa]l)\s+es\s+(eso|esto)\b/i,
      /\bme\s+perd[ií]\b/i,
      /\bno\s+s[eé]\s+por\s+d[óo]nde\s+empezar\b/i,
    ],
  },
  {
    signal: "inappropriate_language",
    patterns: [
      /\bla\s+(re|requete)?\s*(concha|conchita)\b/i,
      /\bput[ao]\s+madre\b/i,
      /\bhij[ao]\s+de\s+put[ao]/i,
      /\bforr[ao]\b/i,
      /\bgil\s+de\s+goma\b/i,
      /\b(carajo|mierda|pelotud[ao])\b/i,
    ],
  },
  {
    signal: "sexual_content",
    patterns: [/\b(porno|porn|sexo|coger|cojer|paja|pajearse)\b/i, /\bmandame\s+(fotos?|nudes)\b/i],
  },
  {
    signal: "drugs_alcohol",
    patterns: [
      /\b(porro|fumo\s+marihuana|marihuana|faso|cocaina|merca)\b/i,
      /\b(borrach[oa]|tomar\s+alcohol|cerveza|fernet)\s+(en\s+el\s+cole|en\s+clase)/i,
    ],
  },
  {
    signal: "off_topic",
    patterns: [
      /\b(tu\s+novi[oa]|ten[eé]s\s+novi[oa])\b/i,
      /\bcu[áa]ntos\s+a[ñn]os\s+ten[eé]s\b/i,
      /\bd[oó]nde\s+viv[íi]s\b/i,
    ],
  },
];

const HELPLINES_AR = [
  "Línea 102 (chicos y adolescentes, gratis, 24hs)",
  "Línea 144 (violencia de género, gratis, 24hs)",
  "Centro de Asistencia al Suicida 135 (CABA y GBA) o 0800-345-1435 (resto del país)",
];

const CRISIS_SIGNALS: SafetySignal[] = [
  "crisis_suicide",
  "crisis_self_harm",
  "crisis_abuse",
  "crisis_violence",
];

const MONITOR_SIGNALS: SafetySignal[] = [
  "harassment_bullying",
  "direct_answer_request",
  "instruction_override",
  "frustration",
  "confusion",
  "inappropriate_language",
  "off_topic",
  "sexual_content",
  "drugs_alcohol",
];

export function filterStudentContent(message: string): ContentSafetyResult {
  if (!message || message.trim().length === 0) {
    return { status: "safe", signals: [], blocked: false };
  }

  const detected = new Set<SafetySignal>();

  for (const rule of PATTERN_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(message))) {
      detected.add(rule.signal);
    }
  }

  const signals = Array.from(detected);
  const hasCrisis = signals.some((s) => CRISIS_SIGNALS.includes(s));

  if (hasCrisis) {
    const severity: "high" | "critical" = signals.includes("crisis_suicide") ? "critical" : "high";

    return {
      status: "escalate",
      signals,
      blocked: false,
      crisisAlert: {
        severity,
        recommendation:
          "Pausar la materia inmediatamente. Validar lo que el alumno expresó, derivar a adulto de confianza y a líneas de ayuda. Notificar al padre/tutor por email del incidente con timestamp.",
        helplines: HELPLINES_AR,
      },
    };
  }

  const hasMonitor = signals.some((s) => MONITOR_SIGNALS.includes(s));
  if (hasMonitor) {
    return { status: "monitor", signals, blocked: false };
  }

  return { status: "safe", signals: [], blocked: false };
}

/**
 * Hint para el TutorAgent: ¿qué acción pedagógica corresponde dado el estado emocional?
 */
export type RecommendedAction =
  | "continue"
  | "consolidate"
  | "de_escalate"
  | "redirect_off_topic"
  | "human_handoff";

export function inferRecommendedAction(safety: ContentSafetyResult): RecommendedAction {
  if (safety.status === "escalate") {
    return "human_handoff";
  }
  if (safety.signals.includes("frustration")) {
    return "de_escalate";
  }
  if (safety.signals.includes("off_topic") || safety.signals.includes("sexual_content")) {
    return "redirect_off_topic";
  }
  return "continue";
}
