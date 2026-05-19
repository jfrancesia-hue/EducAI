import { NextResponse } from "next/server";

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const product = read(formData, "producto");
  const plan = read(formData, "plan");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = new URL("/contacto", request.url);

  if (product) {
    url.searchParams.set("producto", product);
  }
  if (plan) {
    url.searchParams.set("plan", plan);
  }

  if (!apiUrl) {
    url.searchParams.set("error", "api");
    return NextResponse.redirect(url, { status: 303 });
  }

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/public-intake/contact-leads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: read(formData, "nombre"),
        email: read(formData, "email"),
        institution: read(formData, "institucion") || undefined,
        quantity: read(formData, "cantidad") ? Number(read(formData, "cantidad")) : undefined,
        product: product || undefined,
        plan: plan || undefined,
        message: read(formData, "mensaje") || undefined,
      }),
    });

    url.searchParams.set("enviado", response.ok ? "1" : "0");
    if (!response.ok) {
      url.searchParams.set("error", response.status === 429 ? "rate" : "send");
    }
  } catch {
    url.searchParams.set("error", "send");
  }

  return NextResponse.redirect(url, { status: 303 });
}
