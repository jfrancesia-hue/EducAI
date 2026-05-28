import type { Route } from "next";

export type PublicPricingPlan = {
  id: string;
  product: "educai" | "apoyoai";
  name: string;
  audience: string;
  price: string;
  description: string;
  featured?: boolean;
  ctaLabel: string;
  ctaHref: Route;
  includes: string[];
  excludes?: string[];
  note?: string;
};

export const billingCopy = {
  title: "Cobro mensual por debito automatico",
  body: "Cobramos por debito automatico cada mes. Si el pago falla, tu cuenta pasa automaticamente al plan Free, sin cancelaciones ni gestiones innecesarias. Cuando regularizas, volves a tu plan en el momento.",
  faqs: [
    {
      question: "Que pasa si un mes no puedo pagar?",
      answer:
        "La cuenta baja al plan Free automaticamente. No se pierden datos ni hace falta llamar para cancelar.",
    },
    {
      question: "Los creditos gratis vencen?",
      answer: "No. Los creditos Free son unicos de por vida y no vencen.",
    },
    {
      question: "Puedo cambiar de plan?",
      answer: "Si. Podés subir, bajar o volver al plan Free cuando lo necesites.",
    },
    {
      question: "Hay permanencia minima?",
      answer: "No. Los planes mensuales no tienen permanencia.",
    },
    {
      question: "¿Cómo pagan colegios e instituciones?",
      answer: "Los planes institucionales pueden coordinarse por transferencia y factura.",
    },
  ],
};

export const schoolPricing = {
  baseTeachers: 10,
  basePrice: 180000,
  additionalTeacherPrice: 18000,
  exampleTeachers: 15,
};

export function formatArs(value: number) {
  return `$${new Intl.NumberFormat("es-AR").format(value)}`;
}

export function calculateSchoolMonthlyPrice(teachers: number) {
  const activeTeachers = Math.max(1, Math.floor(teachers));
  const extraTeachers = Math.max(0, activeTeachers - schoolPricing.baseTeachers);
  return schoolPricing.basePrice + extraTeachers * schoolPricing.additionalTeacherPrice;
}

export const educaiPublicPlans: PublicPricingPlan[] = [
  {
    id: "free",
    product: "educai",
    name: "Free",
    audience: "Para probar sin tarjeta",
    price: "$0",
    description: "Creditos unicos de por vida para conocer el flujo docente.",
    ctaLabel: "Registrarse gratis",
    ctaHref: "/registro?producto=educai&plan=free",
    includes: [
      "2 planificaciones completas",
      "5 actividades o recursos proximos",
      "Acceso para siempre",
    ],
    excludes: ["PDF y Word", "Rúbricas y evaluaciones", "Alineación jurisdiccional", "Reportes"],
    note: "Sin tarjeta. Los creditos no vencen.",
  },
  {
    id: "docente-individual",
    product: "educai",
    name: "Docente Individual",
    audience: "Para uso semanal",
    price: "$9.900/mes",
    description: "Herramientas esenciales para preparar clases y recursos todos los meses.",
    ctaLabel: "Elegir Individual",
    ctaHref: "/registro?producto=educai&plan=docente-individual",
    includes: [
      "10 planificaciones por mes",
      "20 actividades o recursos",
      "Rúbricas y criterios",
      "Exportacion PDF y Word",
      "Banco personal de recursos",
      "Reporte mensual",
      "Soporte por email",
    ],
  },
  {
    id: "docente-pro",
    product: "educai",
    name: "Docente Pro",
    audience: "Plan recomendado",
    price: "$24.900/mes",
    description:
      "Producción docente más profunda para planificar, evaluar y reutilizar materiales.",
    featured: true,
    ctaLabel: "Elegir Docente Pro",
    ctaHref: "/registro?producto=educai&plan=docente-pro",
    includes: [
      "40 planificaciones por mes",
      "80 actividades o recursos",
      "Rúbricas y evaluaciones",
      "Secuencias multisemana",
      "Alineación a 24 jurisdicciones",
      "Exportacion PDF y Word",
      "Banco avanzado de recursos",
      "Reporte semanal",
      "Soporte prioritario",
    ],
  },
  {
    id: "colegio",
    product: "educai",
    name: "Colegio",
    audience: "Equipos docentes",
    price: "Desde $180.000/mes",
    description: "Base para 10 docentes activos y crecimiento por uso real del equipo.",
    ctaLabel: "Consultar colegio",
    ctaHref: "/contacto?producto=educai&plan=colegio",
    includes: [
      "10 docentes activos incluidos",
      "$18.000/mes por docente activo adicional",
      "Docente activo: generó al menos 1 planificación en el mes",
      "Ejemplo: 15 docentes = $270.000/mes",
      "Acompañamiento para implementacion",
    ],
  },
  {
    id: "institucional",
    product: "educai",
    name: "Institucional",
    audience: "Municipios, redes y organizaciones",
    price: "Desde $2.500/alumno/mes",
    description: "Propuesta por alumno según módulos, alcance y acompañamiento requerido.",
    ctaLabel: "Hablar con ventas",
    ctaHref: "/contacto?producto=educai&plan=institucional",
    includes: [
      "$2.500 a $4.500 por alumno/mes según módulos",
      "Contratacion por transferencia y factura",
      "Configuración institucional",
      "Seguimiento y reportes acordados",
    ],
  },
];

export const apoyoAiPublicPlans: PublicPricingPlan[] = [
  {
    id: "free",
    product: "apoyoai",
    name: "Free",
    audience: "Para conocer el tutor",
    price: "$0",
    description: "Creditos unicos de por vida para probar apoyo por app.",
    ctaLabel: "Registrarse gratis",
    ctaHref: "/registro?producto=apoyoai&plan=free",
    includes: ["10 consultas de tutor por app", "2 fotos de tareas", "1 perfil de hijo"],
    excludes: ["WhatsApp", "Audio", "Diagnóstico adaptativo", "Reportes"],
    note: "Solo tutor por app. WhatsApp empieza en Basico.",
  },
  {
    id: "basico",
    product: "apoyoai",
    name: "Basico",
    audience: "Acompañamiento inicial",
    price: "$14.900/mes",
    description: "Un hijo con apoyo por WhatsApp y app para dudas frecuentes.",
    ctaLabel: "Elegir Básico",
    ctaHref: "/registro?producto=apoyoai&plan=basico",
    includes: [
      "1 hijo",
      "WhatsApp texto: 20 mensajes por dia",
      "Tutor por app con uso generoso",
      "Perfil personalizado",
      "1 diagnóstico inicial",
    ],
    excludes: ["Audio por WhatsApp", "Fotos semanales", "Reporte semanal"],
  },
  {
    id: "plus",
    product: "apoyoai",
    name: "Plus",
    audience: "Plan recomendado",
    price: "$34.900/mes",
    description: "Mas canales y reportes para familias que necesitan seguimiento continuo.",
    featured: true,
    ctaLabel: "Elegir Plus",
    ctaHref: "/registro?producto=apoyoai&plan=plus",
    includes: [
      "1 hijo",
      "WhatsApp texto: 60 mensajes por dia",
      "Tutor por app con uso generoso",
      "Audio por WhatsApp: 10 por semana",
      "Fotos de tareas: 5 por semana",
      "Diagnóstico: 1 por mes",
      "Reporte semanal para familia",
      "Perfil personalizado",
    ],
  },
  {
    id: "familiar",
    product: "apoyoai",
    name: "Familiar",
    audience: "Hasta 3 hijos",
    price: "$69.900/mes",
    description: "Precio total familiar para acompañamiento sostenido por hijo.",
    ctaLabel: "Elegir Familiar",
    ctaHref: "/registro?producto=apoyoai&plan=familiar",
    includes: [
      "Hasta 3 hijos",
      "WhatsApp texto: 25 mensajes por dia por hijo",
      "Audio: 15 por semana por hijo",
      "Fotos de tareas: 8 por semana por hijo",
      "Diagnóstico: 1 por mes por hijo",
      "Reporte semanal por hijo",
      "Perfil personalizado por hijo",
    ],
    note: "El precio mostrado es el total del plan familiar.",
  },
  {
    id: "intensivo",
    product: "apoyoai",
    name: "Intensivo",
    audience: "Alto uso y examenes",
    price: "$119.900/mes",
    description: "Mayor intensidad de apoyo y diagnóstico semanal por hijo.",
    ctaLabel: "Elegir Intensivo",
    ctaHref: "/registro?producto=apoyoai&plan=intensivo",
    includes: [
      "Hasta 3 hijos",
      "WhatsApp texto: 40 mensajes por dia por hijo",
      "Audio: 20 por semana por hijo",
      "Fotos de tareas: 12 por semana por hijo",
      "Diagnóstico semanal por hijo",
      "Reporte semanal por hijo",
      "Perfil personalizado por hijo",
    ],
    note: "La diferencia frente a Familiar es el diagnóstico semanal.",
  },
];

export type PricingPlan = {
  name: string;
  audience: string;
  price: string;
  founderPrice?: string;
  monthlyUsage: string;
  children: string;
  subjects: string;
  channels: string;
  reports: string;
  costRange: string;
  marginRange: string;
  featured?: boolean;
  includes: string[];
};

export type UsageCost = {
  label: string;
  cost: string;
  note: string;
};

export type AddOnPack = {
  name: string;
  price: string;
  detail: string;
};

export type SchoolPlan = {
  name: string;
  price: string;
  scope: string;
};

export const pricingAssumptions = {
  currency: "ARS",
  internalDollar: "$1.500 ARS/USD",
  paymentRail: "Mercado Pago",
  reviewCycle: "Revision mensual por costos dolarizados",
  principle: "WhatsApp medido, app más generosa, audio e imagen desde Plus.",
};

export const pricingPlans: PricingPlan[] = [
  {
    name: "Prueba",
    audience: "Familias nuevas",
    price: "$0",
    monthlyUsage: "7 dias o 60 consultas",
    children: "1 hijo",
    subjects: "1 materia",
    channels: "WhatsApp texto y app",
    reports: "Sin reporte avanzado",
    costRange: "$900-$1.800",
    marginRange: "Captacion",
    includes: ["Diagnóstico inicial breve", "Tutor por texto", "Limite anti-abuso diario"],
  },
  {
    name: "Apoyo Basico",
    audience: "Uso puntual semanal",
    price: "$14.900/mes",
    founderPrice: "$9.900 fundador",
    monthlyUsage: "180 consultas incluidas",
    children: "1 hijo",
    subjects: "2 materias",
    channels: "WhatsApp texto + app",
    reports: "Reporte mensual",
    costRange: "$3.500-$5.500",
    marginRange: "63%-77%",
    includes: ["Tutor socrático", "Práctica guiada", "Resumen mensual para padres"],
  },
  {
    name: "Apoyo Plus",
    audience: "Plan recomendado",
    price: "$29.900/mes",
    founderPrice: "$19.900 fundador",
    monthlyUsage: "500 consultas incluidas",
    children: "1 hijo",
    subjects: "Todas",
    channels: "WhatsApp, app, audio y fotos",
    reports: "Reportes semanales",
    costRange: "$8.000-$12.000",
    marginRange: "60%-73%",
    featured: true,
    includes: ["Modo examen", "Fotos de tareas", "Audio limitado", "Alertas pedagógicas"],
  },
  {
    name: "Apoyo Familiar",
    audience: "Hogar completo",
    price: "$59.900/mes",
    founderPrice: "$39.900 fundador",
    monthlyUsage: "1.200 consultas compartidas",
    children: "Hasta 3 hijos",
    subjects: "Todas",
    channels: "WhatsApp, app, audio y fotos",
    reports: "Reportes por hijo",
    costRange: "$17.000-$24.000",
    marginRange: "60%-72%",
    includes: ["Bolsa familiar", "Seguimiento por hijo", "Prioridad en epocas de examen"],
  },
  {
    name: "Apoyo Intensivo",
    audience: "Alto uso o examenes",
    price: "$99.900/mes",
    monthlyUsage: "2.200 consultas incluidas",
    children: "Hasta 3 hijos",
    subjects: "Todas",
    channels: "Todos los canales",
    reports: "Semanal + avance",
    costRange: "$36.000-$48.000",
    marginRange: "52%-64%",
    includes: ["Mayor prioridad", "Semana de examen incluida", "Diagnósticos adicionales"],
  },
];

export const usageCosts: UsageCost[] = [
  {
    label: "Texto por WhatsApp",
    cost: "$20-$45",
    note: "Incluye entrada, respuesta Twilio e IA liviana.",
  },
  {
    label: "Texto por app/web",
    cost: "$5-$20",
    note: "Sin costo Twilio; conviene empujar alto uso hacia app.",
  },
  {
    label: "Audio hasta 1 min",
    cost: "$45-$80",
    note: "Transcripcion + IA + respuesta; se habilita desde Plus.",
  },
  {
    label: "Foto de tarea",
    cost: "$40-$120",
    note: "Vision/OCR, razonamiento y devolucion pedagógica.",
  },
  {
    label: "Diagnóstico adaptativo",
    cost: "$300-$900",
    note: "Varias interacciones con evaluación y resumen.",
  },
  {
    label: "Reporte semanal",
    cost: "$50-$180",
    note: "Resumen para familia con progreso y proximos pasos.",
  },
];

export const creditRules = [
  "Texto app/web: 0,5 consulta",
  "Texto WhatsApp: 1 consulta",
  "Audio corto: 3 consultas",
  "Foto o tarea: 4-5 consultas",
  "Diagnóstico completo: 20-30 consultas",
  "Reporte avanzado: 10 consultas",
];

export const addOnPacks: AddOnPack[] = [
  {
    name: "100 consultas extra",
    price: "$7.900",
    detail: "Para semanas de más tarea sin subir de plan.",
  },
  {
    name: "300 consultas extra",
    price: "$19.900",
    detail: "Bolsa familiar o mes de alto uso.",
  },
  {
    name: "Semana modo examen",
    price: "$14.900-$24.900",
    detail: "Practica intensiva con prioridad y reportes.",
  },
  {
    name: "Diagnóstico adicional",
    price: "$4.900-$9.900",
    detail: "Nueva materia, cambio de grado o seguimiento.",
  },
];

export const schoolPlans: SchoolPlan[] = [
  {
    name: "Piloto escuela",
    price: "$250.000-$600.000/mes",
    scope: "30-50 alumnos, configuración inicial y seguimiento.",
  },
  {
    name: "Escuela Starter",
    price: "$1.500-$2.500/alumno/mes",
    scope: "App y plataforma, sin WhatsApp intensivo.",
  },
  {
    name: "Escuela con WhatsApp",
    price: "$3.500-$5.500/alumno/mes",
    scope: "Bolsa institucional de consultas por WhatsApp.",
  },
  {
    name: "DocenteAI",
    price: "$12.000-$20.000/docente/mes",
    scope: "Planificación, recursos, evaluación y reportes.",
  },
];
