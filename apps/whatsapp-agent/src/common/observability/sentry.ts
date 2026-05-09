import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry(serviceName: string): void {
  if (initialized) return;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    serverName: serviceName,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    profilesSampleRate: 0,
    sendDefaultPii: false,
  });

  initialized = true;
}

export { Sentry };
