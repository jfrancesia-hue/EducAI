import { test, expect } from "playwright/test";

test("login, fill lesson form and submit", async ({ page }) => {
  test.setTimeout(120_000);

  const email = process.env.EDUCAI_SMOKE_EMAIL;
  const password = process.env.EDUCAI_SMOKE_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing EDUCAI_SMOKE_EMAIL or EDUCAI_SMOKE_PASSWORD");
  }

  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
      console.log(`NAV ${page.url()}`);
    }
  });

  page.on("request", (request) => {
    if (request.url().includes("/app/planificar/generar")) {
      console.log(`REQ ${request.method()} ${request.url()}`);
      const formData = new URLSearchParams(request.postData() ?? "");
      console.log(`REQFIELDS ${Array.from(formData.keys()).join(",")}`);
    }
  });

  page.on("response", (response) => {
    if (response.url().includes("/app/planificar/generar")) {
      console.log(`RES ${response.status()} ${response.url()}`);
      console.log(`RESLOC ${response.headers().location ?? ""}`);
    }
  });

  await page.goto("https://www.educai.com.ar/login?next=%2Fapp%2Fplanificar", {
    waitUntil: "domcontentloaded",
  });
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /^Entrar/ }).click();
  await page.waitForURL(/\/app\/planificar/, { timeout: 60_000 });
  const accessTokenValue = await page.locator('input[name="accessToken"]').inputValue().catch(() => "");
  const cookies = await page.context().cookies("https://www.educai.com.ar");
  console.log(`TOKENLEN ${accessTokenValue.length}`);
  console.log(`COOKIES ${cookies.map((cookie) => cookie.name).join(",")}`);

  await page.locator('input[name="grade"]').fill("7");
  await page.locator('input[name="subject"]').fill("Lengua y Literatura");
  await page.locator('input[name="levelContext"]').fill("Tecnicatura en informatica");
  await page.locator('input[name="topic"]').fill(`Normas APA smoke ${Date.now()}`);
  await page
    .locator('textarea[name="learningGoal"]')
    .fill("Correcto uso de las normas APA en un trabajo.");
  await page.locator('input[name="sessionCount"]').fill("1");
  await page.locator('input[name="totalDurationMinutes"]').fill("40");

  await page.getByRole("button", { name: /Crear clase/ }).last().click();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForURL(/\/app\/planificar\?(created|error)=|\/login/, { timeout: 90_000 });

  console.log(`FINAL ${page.url()}`);
  await expect(page).toHaveURL(/\/app\/planificar\?created=/);
  await expect(page.getByText("Guia generada")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Secuencia" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Objetivos" })).toBeVisible();
});
