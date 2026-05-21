import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { AppLogger } from "../common/logger/app-logger.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { CreateContactLeadDto } from "./dto/create-contact-lead.dto.js";

@Injectable()
export class ContactLeadService {
  private supabaseAdmin: SupabaseClient<any, any, any, any, any> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async create(dto: CreateContactLeadDto, context: { ip?: string; userAgent?: string }) {
    const metadata = {
      status: "open",
      source: "website_contact_form",
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      institution: dto.institution?.trim() || null,
      quantity: dto.quantity ?? null,
      product: dto.product?.trim() || null,
      plan: dto.plan?.trim() || null,
      message: dto.message?.trim() || null,
      ip: context.ip || null,
      userAgent: context.userAgent || null,
      requestedAt: new Date().toISOString(),
    };

    try {
      const tenantId = await this.ensurePublicIntakeTenant();
      const lead = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`select set_config('app.tenant_id', ${tenantId}, true)`;

        return tx.auditLog.create({
          data: {
            tenantId,
            action: "contact_lead.created",
            entity: "ContactLead",
            metadata,
          },
        });
      });

      this.logger.info(
        {
          leadId: lead.id,
          email: metadata.email,
          product: metadata.product,
          plan: metadata.plan,
          storage: "database",
        },
        "contact_lead.created",
      );

      return { data: { id: lead.id, status: "received", storage: "database" } };
    } catch (error) {
      const persistedViaSupabase = await this.persistViaSupabase(metadata, error);
      if (persistedViaSupabase) {
        return persistedViaSupabase;
      }

      return this.persistToLogsOnly(metadata, error);
    }
  }

  private async ensurePublicIntakeTenant(): Promise<string> {
    const tenant = await this.prisma.tenant.upsert({
      where: { slug: "educai-public-intake" },
      update: {},
      create: {
        type: "MINISTRY",
        name: "EducAI Public Intake",
        slug: "educai-public-intake",
        country: "AR",
        metadata: {
          system: true,
          source: "public_intake",
        },
      },
      select: { id: true },
    });

    return tenant.id;
  }

  private getSupabaseAdmin(): SupabaseClient<any, any, any, any, any> | null {
    if (this.supabaseAdmin) {
      return this.supabaseAdmin;
    }

    const url = process.env.SUPABASE_URL?.trim();
    const secretKey = (
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      ""
    ).trim();

    if (!url || !secretKey) {
      return null;
    }

    this.supabaseAdmin = createClient(url, secretKey, {
      db: { schema: "educai" },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    return this.supabaseAdmin;
  }

  private async persistViaSupabase(
    metadata: Record<string, unknown>,
    prismaError: unknown,
  ): Promise<{ data: { id: string; status: "received"; storage: "supabase" } } | null> {
    const supabase = this.getSupabaseAdmin();
    if (!supabase) {
      return null;
    }

    const tenantId = await this.ensurePublicIntakeTenantViaSupabase(supabase);
    if (!tenantId) {
      return null;
    }

    const leadId = `lead-sb-${randomUUID()}`;

    const { error } = await supabase.from("AuditLog").insert({
      id: leadId,
      tenantId,
      action: "contact_lead.created",
      entity: "ContactLead",
      metadata,
    });

    if (error) {
      this.logger.error(
        {
          err: error,
          prismaError,
          leadId,
          email: metadata.email,
          product: metadata.product,
          plan: metadata.plan,
          storage: "supabase_failed",
          metadata,
        },
        "contact_lead.persist_supabase_failed",
      );
      return null;
    }

    this.logger.warn(
      {
        leadId,
        email: metadata.email,
        product: metadata.product,
        plan: metadata.plan,
        storage: "supabase",
      },
      "contact_lead.persisted_via_supabase",
    );

    return { data: { id: leadId, status: "received", storage: "supabase" } };
  }

  private async ensurePublicIntakeTenantViaSupabase(
    supabase: SupabaseClient<any, any, any, any, any>,
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from("Tenant")
      .upsert(
        {
          type: "MINISTRY",
          name: "EducAI Public Intake",
          slug: "educai-public-intake",
          country: "AR",
          metadata: {
            system: true,
            source: "public_intake",
          },
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !data?.id) {
      this.logger.error(
        {
          err: error,
          storage: "supabase_failed",
        },
        "contact_lead.ensure_tenant_supabase_failed",
      );
      return null;
    }

    return data.id;
  }

  private persistToLogsOnly(metadata: Record<string, unknown>, error: unknown) {
    const fallbackId = `lead-log-${randomUUID()}`;

    this.logger.error(
      {
        err: error,
        leadId: fallbackId,
        email: metadata.email,
        product: metadata.product,
        plan: metadata.plan,
        storage: "log_only",
        metadata,
      },
      "contact_lead.persist_failed",
    );

    return { data: { id: fallbackId, status: "received", storage: "log_only" as const } };
  }
}
