import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "./prisma.service.js";

describe("PrismaService RLS context", () => {
  it("setea request.jwt.claims antes de ejecutar el callback tenant-scoped", async () => {
    const prisma = new PrismaService();
    const transaction = { $executeRaw: vi.fn().mockResolvedValue(1) };
    vi.spyOn(prisma, "$transaction").mockImplementation(((
      callback: (tx: typeof transaction) => Promise<unknown>,
    ) => callback(transaction)) as never);

    const result = await prisma.withUser(
      {
        sub: "usr_1",
        tenantId: "tnt_1",
        role: "PARENT",
        familyId: "fam_1",
      },
      (tx) => {
        expect(tx).toBe(transaction);
        return Promise.resolve("ok");
      },
    );

    expect(result).toBe("ok");
    expect(transaction.$executeRaw).toHaveBeenCalledTimes(1);
  });
});
