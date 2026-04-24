import { PrismaClient, SubscriptionPlan, SubscriptionStatus, TenantType, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

  const familyTenant = await prisma.tenant.upsert({
    where: { slug: "familia-demo" },
    update: {},
    create: {
      type: TenantType.FAMILY,
      name: "Familia Demo",
      slug: "familia-demo",
      country: "AR",
    },
  });

  const school = await prisma.school.upsert({
    where: { tenantId: schoolTenant.id },
    update: {},
    create: {
      tenantId: schoolTenant.id,
      name: "Colegio Nativos",
      province: "Tucuman",
      city: "San Miguel de Tucuman",
    },
  });

  const family = await prisma.family.upsert({
    where: { tenantId: familyTenant.id },
    update: {},
    create: {
      tenantId: familyTenant.id,
      name: "Familia Demo",
      country: "AR",
      billingData: { fiscalName: "Consumidor Final" },
    },
  });

  const parentUser = await prisma.user.upsert({
    where: { email: "madre.demo@educai.local" },
    update: {},
    create: {
      tenantId: familyTenant.id,
      email: "madre.demo@educai.local",
      fullName: "Valeria Demo",
      role: UserRole.PARENT,
    },
  });

  await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      tenantId: familyTenant.id,
      userId: parentUser.id,
      familyId: family.id,
      phone: "+5493815550101",
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: "docente.demo@educai.local" },
    update: {},
    create: {
      tenantId: schoolTenant.id,
      email: "docente.demo@educai.local",
      fullName: "Lucia Docente",
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
      title: "Profesora de matematica",
      subjects: ["matematica"],
    },
  });

  const student = await prisma.student.create({
    data: {
      tenantId: familyTenant.id,
      familyId: family.id,
      schoolId: school.id,
      firstName: "Mateo",
      lastName: "Demo",
      grade: 6,
    },
  });

  await prisma.studentProfile.create({
    data: {
      tenantId: familyTenant.id,
      studentId: student.id,
      grade: 6,
      country: "AR",
      curriculum: "AR-NOA",
      learningStyle: "visual",
      strongSubjects: ["ciencias naturales"],
      weakSubjects: ["matematica"],
      whatsappPhone: "+5493815550202",
    },
  });

  await prisma.subscription.upsert({
    where: { familyId: family.id },
    update: {},
    create: {
      tenantId: familyTenant.id,
      familyId: family.id,
      plan: SubscriptionPlan.PREMIUM,
      status: SubscriptionStatus.ACTIVE,
      provider: "mercadopago",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.curriculum.create({
    data: {
      tenantId: schoolTenant.id,
      schoolId: school.id,
      name: "Matematica 6to grado",
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

  await prisma.lessonPlan.create({
    data: {
      tenantId: schoolTenant.id,
      teacherId: teacher.id,
      grade: 6,
      subject: "matematica",
      topic: "Fracciones equivalentes",
      durationMinutes: 120,
      competences: ["razonamiento matematico", "comunicacion"],
      objectives: [{ text: "Reconocer fracciones equivalentes en situaciones cotidianas" }],
      activities: [{ name: "Comparar porciones", duration: 40 }],
      resources: [{ type: "printable", name: "Tarjetas de fracciones" }],
      assessment: { rubric: [{ level: "logrado", descriptor: "Explica el procedimiento" }] },
      generatedByAI: true,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

