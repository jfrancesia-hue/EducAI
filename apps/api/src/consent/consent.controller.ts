import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/authenticated-user.decorator.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { AuthenticatedRequest, AuthenticatedUser } from "../auth/types.js";
import { Audited } from "../common/audit/audited.decorator.js";
import { RevokeConsentDto } from "./dto/revoke-consent.dto.js";
import { SignConsentDto } from "./dto/sign-consent.dto.js";
import { ConsentService } from "./consent.service.js";

interface RequestWithIp extends AuthenticatedRequest {
  ip?: string;
  socket?: { remoteAddress?: string };
}

@ApiTags("consent")
@ApiBearerAuth()
@Controller("consent")
@UseGuards(JwtAuthGuard)
export class ConsentController {
  constructor(private readonly consent: ConsentService) {}

  @Post()
  @ApiCreatedResponse({ description: "Consentimiento parental firmado" })
  @Audited({ action: "consent.signed", entity: "ParentalConsent", skipEntityId: true })
  sign(
    @Body() dto: SignConsentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithIp,
    @Headers("user-agent") userAgent?: string,
  ) {
    return this.consent.sign({
      dto,
      user,
      ipAddress: this.extractIp(request),
      userAgent,
    });
  }

  @Get("student/:id")
  @ApiOkResponse({ description: "Consentimiento parental activo del alumno" })
  @Audited({ action: "consent.active_read", entity: "ParentalConsent" })
  getActive(@Param("id") studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.consent.getActiveForStudent(studentId, user);
  }

  @Get("student/:id/history")
  @ApiOkResponse({ description: "Historial de consentimientos del alumno" })
  @Audited({ action: "consent.history_read", entity: "ParentalConsent" })
  listHistory(@Param("id") studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.consent.listForStudent(studentId, user);
  }

  @Post(":id/revoke")
  @ApiOkResponse({ description: "Consentimiento revocado" })
  @Audited({ action: "consent.revoked", entity: "ParentalConsent" })
  revoke(
    @Param("id") consentId: string,
    @Body() dto: RevokeConsentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.consent.revoke({ consentId, reason: dto.reason, user });
  }

  private extractIp(request: RequestWithIp): string | undefined {
    const forwarded = request.headers["x-forwarded-for"];
    if (forwarded) {
      const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      const first = value?.split(",")[0]?.trim();
      if (first) {
        return first;
      }
    }
    return request.ip ?? request.socket?.remoteAddress ?? undefined;
  }
}
