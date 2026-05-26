import { test, expect } from "playwright/test";

test("login and navigate protected teacher sections", async ({ page }) => {
  test.setTimeout(90_000);

  const email = process.env.EDUCAI_SMOKE_EMAIL;
  const password = process.env.EDUCAI_SMOKE_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing EDUCAI_SMOKE_EMAIL or EDUCAI_SMOKE_PASSWORD");
  }

  await page.goto("https://www.educai.com.ar/login", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /^Entrar/ }).click();
  await page.waitForURL(/\/app(?:$|\?)/, { timeout: 60_000 });

  const sections = [
    { name: "Crear clase", url: /\/app\/planificar/ },
    { name: "Estudiantes", url: /\/app\/estudiantes/ },
    { name: "Reportes", url: /\/app\/reportes/ },
    { name: "Mi perfil", url: /\/app\/perfil/ },
    { name: "Inicio", url: /\/app(?:$|\?)/ },
  ];

  for (const section of sections) {
    await page.getByRole("navigation").getByRole("link", { name: section.name }).click();
    await page.waitForURL(section.url, { timeout: 60_000 });
    await expect(page).not.toHaveURL(/\/login/);
  }
});
