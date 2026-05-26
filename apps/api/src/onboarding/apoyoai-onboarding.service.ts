import {
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Prisma } from "@educai/database";

import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type {
  RegisterApoyoAiFamilyDto,
  RegisterApoyoAiFamilyWithGoogleDto,
} from "./dto/register-apoyoai-family.dto.js";

type ApoyoAiPlanCode = RegisterApoyoAiFamilyDto["plan"];
type ApoyoAiFamilySignupInput = Omit<RegisterApoyoAiFamilyDto, "parentEmail" | "password">;
type PrismaTx = Prisma.TransactionClient;

const PLAN_TO_LEGACY_ENUM: Record<ApoyoAiPlanCode, "FREE" | "BASIC" | "PREMIUM" | "FAMILY"> = {
  free: "FREE",
  basico: "BASIC",
  plus: "PREMIUM",
  familiar: "FAMILY",
  intensivo: "FAMILY",
};

const MERCADOPAGO_PLAN_PRICES: Record<Exclude<ApoyoAiPlanCode, "free">, number> = {
  basico: 14900,
  plus: 34900,
  familiar: 69900,
  intensivo: 119900,
};

interface MercadoPagoPreferenceResponse {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
}

@Injectable()
export class ApoyoAiOnboardingService {
  private supabase?: SupabaseClient;

  constructor(private readonly prisma: PrismaService) {}

  async registerFamily(dto: RegisterApoyoAiFamilyDto) {
    const email = dto.parentEmail.trim().toLowerCase();
    const authUserId = await this.ensureSupabaseUser(email, dto.password, dto.parentFullName);
    return this.createFamilyWorkspace(dto, email, authUserId);
  }

  async registerFamilyWithGoogle(
    dto: RegisterApoyoAiFamilyWithGoogleDto,
    authUser?: AuthenticatedUser,
  ) {
    if (!authUser?.id || !authUser.email) {
      throw new ForbiddenException("La cuenta Google no tiene email confirmado");
    }

    return this.createFamilyWorkspace(dto, authUser.email.trim().toLowerCase(), authUser.id);
  }

  private async createFamilyWorkspace(
    dto: ApoyoAiFamilySignupInput,
    email: string,
    authUserId: string,
  ) {
    const existingUser = await this.findUserByEmailBypassingRls(email);
    if (existingUser) {
      const recovered = await this.recoverExistingFamilyWorkspace(
        existingUser,
        authUserId,
        email,
        dto,
      );
      if (recovered) {
        return recovered;
      }
      throw new ConflictException("Ya existe una cuenta EducAI/ApoyoAI con ese email");
    }

    const normalizedParentPhone = this.normalizePhone(dto.parentWhatsappPhone) ?? "";
    const slug = await this.uniqueFamilySlug(dto.parentFullName);
    const status = this.initialStatus(dto.plan);

    const result = await this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);

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
                whatsappPhone: normalizedStudentPhone ?? null,
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
      plan: dto.plan,
    });

    const checkout = await this.createCheckoutPreferenceSafely({
      plan: dto.plan,
      parentEmail: email,
      parentName: dto.parentFullName,
      externalReference: result.subscription.externalReference,
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
        checkout,
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

  private async recoverExistingFamilyWorkspace(
    existingUser: {
      id: string;
      tenantId: string | null;
      role: string;
    },
    authUserId: string,
    email: string,
    dto: ApoyoAiFamilySignupInput,
  ) {
    if (existingUser.role !== "PARENT" || !existingUser.tenantId) {
      return null;
    }
    const tenantId = existingUser.tenantId;

    const { parent, family, subscription } = await this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);

      const [parentResult, familyResult, subscriptionResult] = await Promise.all([
        tx.parent.findUnique({
          where: { userId: existingUser.id },
          select: { id: true },
        }),
        tx.family.findUnique({
          where: { tenantId },
          select: { id: true },
        }),
        tx.subscription.findFirst({
          where: { tenantId },
          select: {
            id: true,
            product: true,
            planCode: true,
            status: true,
            externalReference: true,
          },
        }),
      ]);

      return {
        parent: parentResult,
        family: familyResult,
        subscription: subscriptionResult,
      };
    });

    if (!parent || !family) {
      return null;
    }

    await this.updateSupabaseMetadata(authUserId, {
      role: "PARENT",
      tenantId,
      familyId: family.id,
      product: "apoyoai",
      plan: dto.plan,
    });

    const checkout = await this.createCheckoutPreferenceSafely({
      plan: dto.plan,
      parentEmail: email,
      parentName: dto.parentFullName,
      externalReference: subscription?.externalReference ?? `apoyoai:${family.id}:${dto.plan}`,
    });

    return {
      data: {
        familyId: family.id,
        tenantId,
        parentId: parent.id,
        subscription: subscription
          ? {
              id: subscription.id,
              product: "apoyoai",
              plan: subscription.planCode,
              status: subscription.status,
              externalReference: subscription.externalReference,
            }
          : undefined,
        checkout,
        students: [],
        nextStep:
          dto.plan === "free" ? "login" : checkout ? "mercadopago_checkout_pending" : "login",
      },
    };
  }

  private async createCheckoutPreferenceSafely(input: {
    plan: ApoyoAiPlanCode;
    parentEmail: string;
    parentName: string;
    externalReference: string | null;
  }): Promise<{ provider: "mercadopago"; preferenceId: string; checkoutUrl: string } | null> {
    try {
      return await this.createCheckoutPreference(input);
    } catch {
      return null;
    }
  }

  private async createCheckoutPreference(input: {
    plan: ApoyoAiPlanCode;
    parentEmail: string;
    parentName: string;
    externalReference: string | null;
  }): Promise<{ provider: "mercadopago"; preferenceId: string; checkoutUrl: string } | null> {
    if (input.plan === "free") {
      return null;
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      throw new ServiceUnavailableException("Mercado Pago no esta configurado");
    }
    if (!input.externalReference) {
      throw new ServiceUnavailableException("La suscripcion no tiene referencia externa");
    }

    const appUrl = process.env.PUBLIC_APP_URL?.replace(/\/+$/u, "");
    const notificationUrl = process.env.MERCADOPAGO_WEBHOOK_URL?.trim();
    const preferenceBody = {
      items: [
        {
          id: `apoyoai-${input.plan}`,
          title: `ApoyoAI ${input.plan}`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: MERCADOPAGO_PLAN_PRICES[input.plan],
        },
      ],
      payer: {
        email: input.parentEmail,
        name: input.parentName,
      },
      external_reference: input.externalReference,
      back_urls: appUrl
        ? {
            success: `${appUrl}/login?registered=apoyoai&payment=success`,
            pending: `${appUrl}/login?registered=apoyoai&payment=pending`,
            failure: `${appUrl}/registro?producto=apoyoai&plan=${input.plan}&error=payment`,
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

  private async ensureSupabaseUser(
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

    if (!error && data.user) {
      return data.user.id;
    }

    if (error?.message.toLowerCase().includes("already")) {
      const existing = await this.findSupabaseUserByEmail(email);
      if (!existing) {
        throw new ConflictException("Ya existe una cuenta Supabase con ese email");
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
        email,
        password,
        email_confirm: true,
        user_metadata: { fullName },
      });

      if (updateError) {
        throw new ServiceUnavailableException(
          `No se pudo reparar la cuenta Supabase existente: ${updateError.message}`,
        );
      }

      return existing.id;
    }

    throw new ServiceUnavailableException(
      `No se pudo crear el usuario Supabase: ${error?.message ?? "sin detalle"}`,
    );
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

  private async findSupabaseUserByEmail(email: string) {
    let page = 1;

    while (true) {
      const { data, error } = await this.getSupabase().auth.admin.listUsers({
        page,
        perPage: 200,
      });

      if (error) {
        throw new ServiceUnavailableException(
          `No se pudo listar usuarios de Supabase: ${error.message}`,
        );
      }

      const user = data.users.find(
        (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
      );
      if (user) {
        return user;
      }

      if (data.users.length < 200) {
        return null;
      }

      page += 1;
    }
  }

  private async findUserByEmailBypassingRls(email: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);
      return tx.user.findUnique({
        where: { email },
        select: { id: true, tenantId: true, role: true },
      });
    });
  }

  private async tenantSlugExists(slug: string): Promise<boolean> {
    const tenant = await this.prisma.$transaction(async (tx) => {
      await this.enableRlsBypass(tx);
      return tx.tenant.findUnique({
        where: { slug },
        select: { id: true },
      });
    });

    return Boolean(tenant);
  }

  private async enableRlsBypass(tx: PrismaTx): Promise<void> {
    await tx.$executeRawUnsafe("SELECT set_config('app.bypass_rls', 'true', true)");
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
      if (!(await this.tenantSlugExists(slug))) {
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

  private normalizePhone(phone?: string): string | undefined {
    const normalized = (phone ?? "").trim().replace(/^whatsapp:/i, "");
    return normalized || undefined;
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }
}
