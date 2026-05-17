import { ConflictException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { PrismaService } from "../prisma/prisma.service.js";
import type { RegisterApoyoAiFamilyDto } from "./dto/register-apoyoai-family.dto.js";

type ApoyoAiPlanCode = RegisterApoyoAiFamilyDto["plan"];

const PLAN_TO_LEGACY_ENUM: Record<ApoyoAiPlanCode, "FREE" | "BASIC" | "PREMIUM" | "FAMILY"> = {
  free: "FREE",
  basico: "BASIC",
  plus: "PREMIUM",
  familiar: "FAMILY",
  intensivo: "FAMILY",
};

@Injectable()
export class ApoyoAiOnboardingService {
  private supabase?: SupabaseClient;

  constructor(private readonly prisma: PrismaService) {}

  async registerFamily(dto: RegisterApoyoAiFamilyDto) {
    const email = dto.parentEmail.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException("Ya existe una cuenta EducAI/ApoyoAI con ese email");
    }

    const authUserId = await this.createSupabaseUser(email, dto.password, dto.parentFullName);
    const normalizedParentPhone = this.normalizePhone(dto.parentWhatsappPhone);
    const slug = await this.uniqueFamilySlug(dto.parentFullName);
    const status = this.initialStatus(dto.plan);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          type: "FAMILY",
          name: dto.parentFullName,
          slug,
          country: "AR",
          metadata: {
            product: "apoyoai",
            plan: dto.plan,
            source: "self_service_signup",
          },
        },
      });

      const family = await tx.family.create({
        data: {
          tenantId: tenant.id,
          name: `Familia ${dto.parentFullName}`,
          country: "AR",
          billingData: {
            parentEmail: email,
            parentWhatsappPhone: normalizedParentPhone,
          },
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          fullName: dto.parentFullName,
          role: "PARENT",
        },
      });

      const parent = await tx.parent.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          familyId: family.id,
          phone: normalizedParentPhone,
        },
      });

      const subscription = await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          familyId: family.id,
          product: "APOYOAI",
          plan: PLAN_TO_LEGACY_ENUM[dto.plan],
          planCode: dto.plan,
          status,
          provider: "mercadopago",
          externalReference: `apoyoai:${family.id}:${dto.plan}`,
          currentPeriodEnd: this.addDays(new Date(), 30),
        },
      });

      const students = [];
      for (const child of dto.students) {
        const normalizedStudentPhone = this.normalizePhone(child.whatsappPhone);
        const student = await tx.student.create({
          data: {
            tenantId: tenant.id,
            familyId: family.id,
            firstName: child.firstName,
            lastName: child.lastName,
            grade: child.grade,
            profile: {
              create: {
                tenantId: tenant.id,
                grade: child.grade,
                country: "AR",
                curriculum: child.curriculum ?? "AR-NOA",
                strongSubjects: [],
                weakSubjects: [],
                whatsappPhone: normalizedStudentPhone,
                whatsappContacts: {
                  create: this.buildContacts({
                    tenantId: tenant.id,
                    parentPhone: normalizedParentPhone,
                    studentPhone: normalizedStudentPhone,
                    studentName: child.firstName,
                    parentName: dto.parentFullName,
                  }),
                },
              },
            },
          },
          include: { profile: true },
        });
        students.push(student);
      }

      return { tenant, family, user, parent, subscription, students };
    });

    await this.updateSupabaseMetadata(authUserId, {
      role: "PARENT",
      tenantId: result.tenant.id,
      familyId: result.family.id,
      product: "apoyoai",
    });

    return {
      data: {
        familyId: result.family.id,
        tenantId: result.tenant.id,
        parentId: result.parent.id,
        subscription: {
          id: result.subscription.id,
          product: "apoyoai",
          plan: result.subscription.planCode,
          status: result.subscription.status,
          externalReference: result.subscription.externalReference,
        },
        students: result.students.map((student) => ({
          id: student.id,
          profileId: student.profile?.id,
          firstName: student.firstName,
          grade: student.grade,
        })),
        nextStep:
          result.subscription.status === "ACTIVE" ? "login" : "mercadopago_checkout_pending",
      },
    };
  }

  private getSupabase(): SupabaseClient {
    if (this.supabase) {
      return this.supabase;
    }

    const url = process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !secretKey) {
      throw new ServiceUnavailableException("Supabase admin no esta configurado");
    }

    this.supabase = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return this.supabase;
  }

  private async createSupabaseUser(
    email: string,
    password: string,
    fullName: string,
  ): Promise<string> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { fullName },
    });

    if (error || !data.user) {
      if (error?.message.toLowerCase().includes("already")) {
        throw new ConflictException("Ya existe una cuenta Supabase con ese email");
      }
      throw new ServiceUnavailableException(
        `No se pudo crear el usuario Supabase: ${error?.message ?? "sin detalle"}`,
      );
    }

    return data.user.id;
  }

  private async updateSupabaseMetadata(
    userId: string,
    appMetadata: Record<string, string>,
  ): Promise<void> {
    const { error } = await this.getSupabase().auth.admin.updateUserById(userId, {
      app_metadata: appMetadata,
    });

    if (error) {
      throw new ServiceUnavailableException(
        `Cuenta creada, pero no se pudieron guardar claims Supabase: ${error.message}`,
      );
    }
  }

  private buildContacts(input: {
    tenantId: string;
    parentPhone: string;
    studentPhone?: string;
    studentName: string;
    parentName: string;
  }) {
    const contacts: Array<{
      tenantId: string;
      role: "PARENT" | "STUDENT";
      phone: string;
      displayName: string;
    }> = [
      {
        tenantId: input.tenantId,
        role: "PARENT" as const,
        phone: input.parentPhone,
        displayName: input.parentName,
      },
    ];

    if (input.studentPhone && input.studentPhone !== input.parentPhone) {
      contacts.push({
        tenantId: input.tenantId,
        role: "STUDENT",
        phone: input.studentPhone,
        displayName: input.studentName,
      });
    }

    return contacts;
  }

  private initialStatus(plan: ApoyoAiPlanCode): "ACTIVE" | "PAST_DUE" {
    if (plan === "free") {
      return "ACTIVE";
    }

    return process.env.APOYOAI_AUTO_ACTIVATE_PAID_SIGNUPS === "true" ? "ACTIVE" : "PAST_DUE";
  }

  private async uniqueFamilySlug(parentName: string): Promise<string> {
    const base = this.slugify(`apoyoai-${parentName}`) || "apoyoai-familia";
    for (let index = 0; index < 20; index += 1) {
      const suffix = index === 0 ? "" : `-${index + 1}`;
      const slug = `${base}${suffix}`;
      const existing = await this.prisma.tenant.findUnique({ where: { slug } });
      if (!existing) {
        return slug;
      }
    }
    return `${base}-${Date.now()}`;
  }

  private slugify(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private normalizePhone(phone?: string): string {
    return (phone ?? "").trim().replace(/^whatsapp:/i, "");
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }
}
