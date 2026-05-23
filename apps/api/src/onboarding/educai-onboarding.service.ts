import {
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type {
  RegisterEducAiTeacherDto,
  RegisterEducAiTeacherWithGoogleDto,
} from "./dto/register-educai-teacher.dto.js";

type EducAiTeacherSignupInput = Omit<RegisterEducAiTeacherDto, "email" | "password">;
type EducAiPlanCode = RegisterEducAiTeacherDto["plan"];

const MERCADOPAGO_PLAN_PRICES: Record<Exclude<EducAiPlanCode, "free">, number> = {
  "docente-individual": 9900,
  "docente-pro": 24900,
};

interface MercadoPagoPreferenceResponse {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
}

@Injectable()
export class EducAiOnboardingService {
  private supabase?: SupabaseClient;

  constructor(private readonly prisma: PrismaService) {}

  async registerTeacher(dto: RegisterEducAiTeacherDto) {
    const email = dto.email.trim().toLowerCase();
    const authUserId = await this.createSupabaseUser(email, dto.password, dto.fullName);
    return this.createTeacherWorkspace(dto, email, authUserId);
  }

  async registerTeacherWithGoogle(
    dto: RegisterEducAiTeacherWithGoogleDto,
    authUser?: AuthenticatedUser,
  ) {
    if (!authUser?.id || !authUser.email) {
      throw new ForbiddenException("La cuenta Google no tiene email confirmado");
    }

    return this.createTeacherWorkspace(dto, authUser.email.trim().toLowerCase(), authUser.id);
  }

  private async createTeacherWorkspace(
    dto: EducAiTeacherSignupInput,
    email: string,
    authUserId: string,
  ) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException("Ya existe una cuenta EducAI con ese email");
    }

    const schoolName = dto.schoolName?.trim() || `Espacio docente de ${dto.fullName}`;
    const slug = await this.uniqueSchoolSlug(schoolName, dto.fullName);
    const subjects = this.parseSubjects(dto.subjects);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          type: "SCHOOL",
          name: schoolName,
          slug,
          country: "AR",
          metadata: {
            product: "educai",
            plan: dto.plan,
            source: "self_service_teacher_signup",
          },
        },
      });

      const school = await tx.school.create({
        data: {
          tenantId: tenant.id,
          name: schoolName,
          country: "AR",
          province: dto.province?.trim() || null,
          city: dto.city?.trim() || null,
          settings: {
            product: "educai",
            plan: dto.plan,
            onboarding: "teacher_self_service",
          },
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          fullName: dto.fullName,
          role: "TEACHER",
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          schoolId: school.id,
          title: dto.title?.trim() || null,
          subjects,
        },
      });

      return { tenant, school, user, teacher };
    });

    await this.updateSupabaseMetadata(authUserId, {
      role: "TEACHER",
      tenantId: result.tenant.id,
      schoolId: result.school.id,
      teacherId: result.teacher.id,
      product: "educai",
      plan: dto.plan,
    });

    const checkout = await this.createCheckoutPreferenceSafely({
      plan: dto.plan,
      email,
      fullName: dto.fullName,
      externalReference: `educai:${result.tenant.id}:${dto.plan}`,
    });

    return {
      data: {
        tenantId: result.tenant.id,
        schoolId: result.school.id,
        teacherId: result.teacher.id,
        plan: dto.plan,
        checkout,
        nextStep:
          dto.plan === "free"
            ? "login"
            : checkout
              ? "mercadopago_checkout_pending"
              : "payment_unavailable",
      },
    };
  }

  private async createCheckoutPreferenceSafely(input: {
    plan: EducAiPlanCode;
    email: string;
    fullName: string;
    externalReference: string;
  }): Promise<{ provider: "mercadopago"; preferenceId: string; checkoutUrl: string } | null> {
    try {
      return await this.createCheckoutPreference(input);
    } catch {
      return null;
    }
  }

  private async createCheckoutPreference(input: {
    plan: EducAiPlanCode;
    email: string;
    fullName: string;
    externalReference: string;
  }): Promise<{ provider: "mercadopago"; preferenceId: string; checkoutUrl: string } | null> {
    if (input.plan === "free") {
      return null;
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      throw new ServiceUnavailableException("Mercado Pago no esta configurado");
    }

    const appUrl = process.env.PUBLIC_APP_URL?.replace(/\/+$/u, "");
    const notificationUrl = process.env.MERCADOPAGO_WEBHOOK_URL?.trim();
    const preferenceBody = {
      items: [
        {
          id: `educai-${input.plan}`,
          title: `EducAI ${input.plan}`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: MERCADOPAGO_PLAN_PRICES[input.plan],
        },
      ],
      payer: {
        email: input.email,
        name: input.fullName,
      },
      external_reference: input.externalReference,
      back_urls: appUrl
        ? {
            success: `${appUrl}/login?registered=educai&payment=success&next=/app`,
            pending: `${appUrl}/login?registered=educai&payment=pending&next=/app`,
            failure: `${appUrl}/registro?producto=educai&plan=${input.plan}&error=payment`,
          }
        : undefined,
      notification_url: notificationUrl || undefined,
      auto_return: appUrl ? "approved" : undefined,
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException("No se pudo crear el checkout de Mercado Pago");
    }

    const preference = (await response.json()) as MercadoPagoPreferenceResponse;
    const checkoutUrl = preference.init_point ?? preference.sandbox_init_point;
    if (!preference.id || !checkoutUrl) {
      throw new ServiceUnavailableException("Mercado Pago no devolvio URL de checkout");
    }

    return {
      provider: "mercadopago",
      preferenceId: preference.id,
      checkoutUrl,
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
    const { data, error } = await this.getSupabase().auth.admin.createUser({
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

  private parseSubjects(subjects?: string): string[] {
    return (subjects ?? "")
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  private async uniqueSchoolSlug(schoolName: string, fullName: string): Promise<string> {
    const base = this.slugify(`educai-${schoolName || fullName}`) || "educai-docente";
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
}
