import { Injectable } from "@nestjs/common";

import { AppLogger } from "../common/logger/app-logger.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { CreateContactLeadDto } from "./dto/create-contact-lead.dto.js";

@Injectable()
export class ContactLeadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async create(dto: CreateContactLeadDto, context: { ip?: string; userAgent?: string }) {
    const lead = await this.prisma.contactLead.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        institution: dto.institution?.trim() || null,
        quantity: dto.quantity ?? null,
        product: dto.product?.trim() || null,
        plan: dto.plan?.trim() || null,
        message: dto.message?.trim() || null,
        ip: context.ip || null,
        userAgent: context.userAgent || null,
      },
    });

    this.logger.info(
      {
        leadId: lead.id,
        email: lead.email,
        product: lead.product,
        plan: lead.plan,
      },
      "contact_lead.created",
    );

    return { data: { id: lead.id, status: lead.status } };
  }
}
