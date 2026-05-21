import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient } from "@educai/database";

import { TenantContextService } from "./tenant-context.service.js";

const TENANT_SCOPED_MODELS = new Set([
  "User",
  "Role",
  "School",
  "Family",
  "Parent",
  "Teacher",
  "Student",
  "Classroom",
  "Subject",
  "Enrollment",
  "StudentProfile",
  "EducaiWhatsappContact",
  "Conversation",
  "Message",
  "LearningSession",
  "Achievement",
  "ParentReport",
  "Subscription",
  "Curriculum",
  "CurriculumGap",
  "LessonPlan",
  "TeacherEnrollment",
  "CommunityPost",
  "CommunityComment",
  "AuditLog",
]);

type MiddlewareArgs = Record<string, unknown> & {
  where?: unknown;
  create?: unknown;
  data?: unknown;
};

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly tenantContext: TenantContextService) {
    super();

    this.$use(async (params, next) => {
      this.applyTenantScope(params);
      const result: unknown = await next(params);
      return result;
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private applyTenantScope(params: Prisma.MiddlewareParams): void {
    const context = this.tenantContext.get();
    const tenantId = context?.tenantId?.trim();
    const args = (params.args ?? {}) as MiddlewareArgs;

    if (!tenantId || context?.bypass || !params.model || !TENANT_SCOPED_MODELS.has(params.model)) {
      return;
    }

    switch (params.action) {
      case "findUnique":
      case "findUniqueOrThrow":
      case "findFirst":
      case "findFirstOrThrow":
      case "findMany":
      case "count":
      case "aggregate":
      case "groupBy":
      case "update":
      case "updateMany":
      case "delete":
      case "deleteMany":
      case "upsert":
        params.args = {
          ...args,
          where: this.withTenantId(args.where, tenantId),
        };

        if (params.action === "upsert" && args.create) {
          (params.args as MiddlewareArgs).create = this.withTenantData(args.create, tenantId);
        }
        return;
      case "create":
        params.args = {
          ...args,
          data: this.withTenantData(args.data, tenantId),
        };
        return;
      case "createMany":
        params.args = {
          ...args,
          data: Array.isArray(args.data)
            ? args.data.map((item) => this.withTenantData(item, tenantId))
            : this.withTenantData(args.data, tenantId),
        };
        return;
      default:
        return;
    }
  }

  private withTenantId(where: unknown, tenantId: string) {
    if (!where || typeof where !== "object" || Array.isArray(where)) {
      return { tenantId };
    }

    return {
      ...(where as Record<string, unknown>),
      tenantId,
    };
  }

  private withTenantData(data: unknown, tenantId: string) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return data;
    }

    return {
      ...(data as Record<string, unknown>),
      tenantId,
    };
  }
}
