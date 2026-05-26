import { test, expect } from "playwright/test";

test("login and use dashboard action buttons", async ({ page }) => {
  test.setTimeout(180_000);

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

  const actions = [
    { name: "Crear clase", index: 1, url: /\/app\/planificar/ },
    { name: "Crear una clase editable", index: 0, url: /\/app\/planificar/ },
    { name: /Abrir m[oó]dulo de estudiantes/, index: 0, url: /\/app\/estudiantes/ },
    { name: "Revisar estudiantes", index: 0, url: /\/app\/estudiantes/ },
    { name: "Revisar indicadores", index: 0, url: /\/app\/reportes/ },
  ];

  for (const action of actions) {
    await page.goto("https://www.educai.com.ar/app", { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/login/);
    await page.getByRole("link", { name: action.name }).nth(action.index).click();
    await page.waitForURL(action.url, { timeout: 60_000 });
    await page.waitForTimeout(2_000);
    await expect(page).not.toHaveURL(/\/login/);
  }

  await page.goto("https://www.educai.com.ar/app", { waitUntil: "domcontentloaded" });
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByText("Planificaciones recientes")).toBeVisible();

  const recentLesson = page.locator('a[href*="/app/planificar?created="]').first();
  await expect(recentLesson).toBeVisible({ timeout: 60_000 });
  await recentLesson.click();
  await page.waitForURL(/\/app\/planificar\?created=/, { timeout: 60_000 });
  await expect(page.getByText("Guia generada")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Secuencia" })).toBeVisible();
});
