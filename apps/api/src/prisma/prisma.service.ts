import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient } from "@educai/database";
import type { AuthenticatedUser } from "../auth/types.js";

type RlsTransaction = Prisma.TransactionClient;

type RlsClaims = {
  sub?: string;
  role: string;
  tenant_id?: string;
  family_id?: string;
  school_id?: string;
  teacher_id?: string;
};

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  withUser<T>(
    user: AuthenticatedUser,
    callback: (transaction: RlsTransaction) => Promise<T>,
  ): Promise<T> {
    return this.withClaims(
      {
        sub: user.sub,
        role: user.role,
        tenant_id: user.tenantId,
        family_id: user.familyId,
        school_id: user.schoolId,
        teacher_id: user.teacherId,
      },
      callback,
    );
  }

  withServiceRole<T>(callback: (transaction: RlsTransaction) => Promise<T>): Promise<T> {
    return this.withClaims({ role: "service_role" }, callback);
  }

  private withClaims<T>(
    claims: RlsClaims,
    callback: (transaction: RlsTransaction) => Promise<T>,
  ): Promise<T> {
    const serializedClaims = JSON.stringify(claims);

    return this.$transaction(async (transaction) => {
      await transaction.$executeRaw`select set_config('request.jwt.claims', ${serializedClaims}, true)`;
      return callback(transaction);
    });
  }
}
