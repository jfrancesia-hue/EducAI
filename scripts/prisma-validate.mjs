import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://educai:educai@localhost:5432/educai_validation",
};

const result = spawnSync("pnpm exec prisma validate", {
  cwd: process.cwd(),
  env,
  shell: true,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
