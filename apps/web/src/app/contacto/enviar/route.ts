import { redirect } from "next/navigation";

export async function POST(request: Request) {
  await request.formData();
  redirect("/contacto?enviado=1");
}
