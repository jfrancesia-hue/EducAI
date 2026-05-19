import { Body, Controller, Headers, Ip, Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";

import { ContactLeadService } from "./contact-lead.service.js";
import type { CreateContactLeadDto } from "./dto/create-contact-lead.dto.js";
import { PublicThrottleGuard } from "./public-throttle.guard.js";

@ApiTags("public-intake")
@Controller("public-intake")
export class ContactLeadController {
  constructor(private readonly leads: ContactLeadService) {}

  @Post("contact-leads")
  @UseGuards(PublicThrottleGuard)
  @ApiCreatedResponse({ description: "Lead comercial recibido" })
  create(
    @Body() dto: CreateContactLeadDto,
    @Ip() ip: string,
    @Headers("user-agent") userAgent?: string,
  ) {
    return this.leads.create(dto, { ip, userAgent });
  }
}
