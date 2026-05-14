export function hasApiBaseUrl() {
  return Boolean(process.env.NEXT_PUBLIC_API_URL);
}

export function getApiBaseUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_API_URL in apps/gov-dashboard.");
  }

  return url.replace(/\/+$/u, "");
}
