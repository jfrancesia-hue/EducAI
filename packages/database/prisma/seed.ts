import {
  PrismaClient,
  SubscriptionPlan,
  SubscriptionStatus,
  TenantType,
  UserRole,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type FamilySeed = {
  slug: string;
  tenantName: string;
  familyName: string;
  province: string;
  parent: { email: string; fullName: string; phone: string };
  students: Array<{
    firstName: string;
    lastName: string;
    grade: number;
    learningStyle: "visual" | "auditivo" | "kinestesico";
    strongSubjects: string[];
    weakSubjects: string[];
    whatsappPhone?: string;
    diagnosticCompleted?: boolean;
    diagnosticScore?: Prisma.InputJsonValue;
  }>;
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    provider: "mercadopago" | "stripe";
    daysUntilEnd: number;
  };
};

const FAMILIES: FamilySeed[] = [
  {
    slug: "familia-nativos-consultora",
    tenantName: "Familia Nativos Consultora",
    familyName: "Familia Nativos Consultora",
    province: "Tucumán",
    parent: {
      email: "valeria.nativos@educai.local",
      fullName: "Valeria Pérez (Nativos Consultora)",
      phone: "+5493815550101",
    },
    students: [
      {
        firstName: "Mateo",
        lastName: "Pérez",
        grade: 6,
        learningStyle: "visual",
        strongSubjects: ["ciencias naturales"],
        weakSubjects: ["matematica"],
        whatsappPhone: "+5493815550202",
        diagnosticCompleted: true,
        diagnosticScore: {
          totalQuestions: 12,
          correct: 8,
          score: 0.66,
          strengths: ["comprension"],
          opportunities: ["aplicacion en problemas"],
        },
      },
      {
        firstName: "Camila",
        lastName: "Pérez",
        grade: 4,
        learningStyle: "auditivo",
        strongSubjects: ["lengua"],
        weakSubjects: ["matematica"],
        whatsappPhone: "+5493815550203",
      },
    ],
    subscription: {
      plan: SubscriptionPlan.PREMIUM,
      status: SubscriptionStatus.ACTIVE,
      provider: "mercadopago",
      daysUntilEnd: 30,
    },
  },
  {
    slug: "familia-garcia-salta",
    tenantName: "Familia García",
    familyName: "Familia García Salta",
    province: "Salta",
    parent: {
      email: "carlos.garcia@educai.local",
      fullName: "Carlos García",
      phone: "+5493875550110",
    },
    students: [
      {
        firstName: "Lucas",
        lastName: "García",
        grade: 10,
        learningStyle: "kinestesico",
        strongSubjects: ["matematica", "ciencias naturales"],
        weakSubjects: ["lengua"],
        whatsappPhone: "+5493875550211",
      },
    ],
    subscription: {
      plan: SubscriptionPlan.BASIC,
      status: SubscriptionStatus.ACTIVE,
      provider: "mercadopago",
      daysUntilEnd: 14,
    },
  },
  {
    slug: "familia-lopez-jujuy",
    tenantName: "Familia López",
    familyName: "Familia López Jujuy",
    province: "Jujuy",
    parent: {
      email: "ana.lopez@educai.local",
      fullName: "Ana López",
      phone: "+5493885550120",
    },
    students: [
      {
        firstName: "Sofía",
        lastName: "López",
        grade: 7,
        learningStyle: "visual",
        strongSubjects: ["lengua"],
        weakSubjects: ["matematica", "ciencias naturales"],
        whatsappPhone: "+5493885550221",
      },
      {
        firstName: "Tomás",
        lastName: "López",
        grade: 12,
        learningStyle: "auditivo",
        strongSubjects: ["historia"],
        weakSubjects: ["matematica"],
        whatsappPhone: "+5493885550222",
      },
    ],
    subscription: {
      plan: SubscriptionPlan.FAMILY,
      status: SubscriptionStatus.ACTIVE,
      provider: "mercadopago",
      daysUntilEnd: 60,
    },
  },
];

async function ensurePermissions() {
  const permissions = [
    ["students:read", "Leer perfiles de estudiantes"],
    ["students:write", "Crear y editar perfiles de estudiantes"],
    ["curricula:analyze", "Analizar curriculos institucionales"],
    ["lesson-plans:write", "Generar y editar planificaciones"],
    ["admin:manage", "Administrar usuarios y configuracion"],
  ] as const;

  for (const [key, description] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }
}

async function ensureSchool() {
  const schoolTenant = await prisma.tenant.upsert({
    where: { slug: "colegio-nativos" },
    update: {},
    create: {
      type: TenantType.SCHOOL,
      name: "Colegio Nativos",
      slug: "colegio-nativos",
      country: "AR",
    },
  });

  const school = await prisma.school.upsert({
    where: { tenantId: schoolTenant.id },
    update: {},
    create: {
      tenantId: schoolTenant.id,
      name: "Colegio Nativos",
      province: "Tucumán",
      city: "San Miguel de Tucumán",
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: "docente.demo@educai.local" },
    update: {},
    create: {
      tenantId: schoolTenant.id,
      email: "docente.demo@educai.local",
      fullName: "Lucía Docente",
      role: UserRole.TEACHER,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      tenantId: schoolTenant.id,
      userId: teacherUser.id,
      schoolId: school.id,
      title: "Profesora de matemática",
      subjects: ["matematica"],
    },
  });

  await prisma.curriculum.upsert({
    where: { id: `curr-${school.id}-mat-6` },
    update: {},
    create: {
      id: `curr-${school.id}-mat-6`,
      tenantId: schoolTenant.id,
      schoolId: school.id,
      name: "Matemática 6° grado",
      grade: 6,
      subject: "matematica",
      source: "institucional",
      content: {
        units: [
          {
            title: "Fracciones y proporcionalidad",
            competences: ["resolver problemas", "argumentar procedimientos"],
          },
        ],
      },
    },
  });

  await prisma.lessonPlan.upsert({
    where: { id: `plan-${teacher.id}-fracciones` },
    update: {},
    create: {
      id: `plan-${teacher.id}-fracciones`,
      tenantId: schoolTenant.id,
      teacherId: teacher.id,
      grade: 6,
      subject: "matematica",
      topic: "Fracciones equivalentes",
      durationMinutes: 120,
      competences: ["razonamiento matemático", "comunicación"],
      objectives: [{ text: "Reconocer fracciones equivalentes en situaciones cotidianas" }],
      activities: [{ name: "Comparar porciones", duration: 40 }],
      resources: [{ type: "printable", name: "Tarjetas de fracciones" }],
      assessment: { rubric: [{ level: "logrado", descriptor: "Explica el procedimiento" }] },
      generatedByAI: true,
    },
  });

  return { schoolTenant, school };
}

async function seedFamily(seed: FamilySeed) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: seed.slug },
    update: {},
    create: {
      type: TenantType.FAMILY,
      name: seed.tenantName,
      slug: seed.slug,
      country: "AR",
    },
  });

  const family = await prisma.family.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      name: seed.familyName,
      country: "AR",
      billingData: { fiscalName: "Consumidor Final", province: seed.province },
    },
  });

  const parentUser = await prisma.user.upsert({
    where: { email: seed.parent.email },
    update: {},
    create: {
      tenantId: tenant.id,
      email: seed.parent.email,
      fullName: seed.parent.fullName,
      role: UserRole.PARENT,
    },
  });

  await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: parentUser.id,
      familyId: family.id,
      phone: seed.parent.phone,
    },
  });

  for (const studentSeed of seed.students) {
    const existing = await prisma.student.findFirst({
      where: {
        familyId: family.id,
        firstName: studentSeed.firstName,
        lastName: studentSeed.lastName,
      },
    });

    const student =
      existing ??
      (await prisma.student.create({
        data: {
          tenantId: tenant.id,
          familyId: family.id,
          firstName: studentSeed.firstName,
          lastName: studentSeed.lastName,
          grade: studentSeed.grade,
        },
      }));

    await prisma.studentProfile.upsert({
      where: { studentId: student.id },
      update: {
        grade: studentSeed.grade,
        learningStyle: studentSeed.learningStyle,
        strongSubjects: studentSeed.strongSubjects,
        weakSubjects: studentSeed.weakSubjects,
        whatsappPhone: studentSeed.whatsappPhone,
        diagnosticCompleted: studentSeed.diagnosticCompleted ?? false,
        diagnosticScore: studentSeed.diagnosticScore ?? undefined,
      },
      create: {
        tenantId: tenant.id,
        studentId: student.id,
        grade: studentSeed.grade,
        country: "AR",
        curriculum: "AR-NOA",
        learningStyle: studentSeed.learningStyle,
        strongSubjects: studentSeed.strongSubjects,
        weakSubjects: studentSeed.weakSubjects,
        whatsappPhone: studentSeed.whatsappPhone,
        diagnosticCompleted: studentSeed.diagnosticCompleted ?? false,
        diagnosticScore: studentSeed.diagnosticScore ?? undefined,
      },
    });
  }

  await prisma.subscription.upsert({
    where: { familyId: family.id },
    update: {
      plan: seed.subscription.plan,
      status: seed.subscription.status,
      provider: seed.subscription.provider,
      currentPeriodEnd: new Date(Date.now() + seed.subscription.daysUntilEnd * 24 * 60 * 60 * 1000),
    },
    create: {
      tenantId: tenant.id,
      familyId: family.id,
      plan: seed.subscription.plan,
      status: seed.subscription.status,
      provider: seed.subscription.provider,
      currentPeriodEnd: new Date(Date.now() + seed.subscription.daysUntilEnd * 24 * 60 * 60 * 1000),
    },
  });
}

async function main() {
  await ensurePermissions();
  await ensureSchool();
  for (const family of FAMILIES) {
    await seedFamily(family);
  }
  console.warn(
    `Seed completado: ${FAMILIES.length} familias, ${FAMILIES.flatMap((f) => f.students).length} estudiantes con StudentProfile.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
