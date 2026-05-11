const REQUIRED_PRODUCTION_ENV = ["REDIS_URL"] as const;

export function requireWorkerProductionEnv(env: NodeJS.ProcessEnv): void {
  requireProductionEnv("worker", REQUIRED_PRODUCTION_ENV, env);
}

function requireProductionEnv(
  service: string,
  keys: readonly string[],
  env: NodeJS.ProcessEnv,
): void {
  if (env.NODE_ENV !== "production") {
    return;
  }

  const missing = keys.filter((key) => !env[key]?.trim());
  if (missing.length === 0) {
    return;
  }

  throw new Error(
    `[${service}] faltan variables de entorno obligatorias para produccion: ${missing.join(", ")}`,
  );
}
