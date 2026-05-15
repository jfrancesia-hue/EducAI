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
  principle: "WhatsApp medido, app mas generosa, audio e imagen desde Plus.",
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
    includes: ["Diagnostico inicial breve", "Tutor por texto", "Limite anti-abuso diario"],
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
    includes: ["Tutor socratico", "Practica guiada", "Resumen mensual para padres"],
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
    includes: ["Modo examen", "Fotos de tareas", "Audio limitado", "Alertas pedagogicas"],
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
    includes: ["Mayor prioridad", "Semana de examen incluida", "Diagnosticos adicionales"],
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
    note: "Vision/OCR, razonamiento y devolucion pedagogica.",
  },
  {
    label: "Diagnostico adaptativo",
    cost: "$300-$900",
    note: "Varias interacciones con evaluacion y resumen.",
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
  "Diagnostico completo: 20-30 consultas",
  "Reporte avanzado: 10 consultas",
];

export const addOnPacks: AddOnPack[] = [
  {
    name: "100 consultas extra",
    price: "$7.900",
    detail: "Para semanas de mas tarea sin subir de plan.",
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
    name: "Diagnostico adicional",
    price: "$4.900-$9.900",
    detail: "Nueva materia, cambio de grado o seguimiento.",
  },
];

export const schoolPlans: SchoolPlan[] = [
  {
    name: "Piloto escuela",
    price: "$250.000-$600.000/mes",
    scope: "30-50 alumnos, configuracion inicial y seguimiento.",
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
    scope: "Planificacion, recursos, evaluacion y reportes.",
  },
];
