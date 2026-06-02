import { test, expect } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

const PROJECT = "Freire Batista ADV";

/** Open the "Freire Batista ADV" detail by clicking its row in the list. */
async function openProjectDetail(page: import("@playwright/test").Page) {
  await page.goto("/projects");
  await page.getByRole("row", { name: new RegExp(PROJECT) }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: PROJECT })).toBeVisible();
}

test.describe("Project detail — staff view (M2)", () => {
  test("a consultant sees coverage, all attribute categories and the theme section", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.consultor);
    await openProjectDetail(page);

    // Coverage bar (staff only).
    await expect(page.getByText("Cobertura")).toBeVisible();

    // Attributes block + multiple MPO categories (staff sees everything).
    await expect(page.getByRole("heading", { name: "Atributos do projeto" })).toBeVisible();
    await expect(page.getByText(/Conteúdo geral \(\d+\)/)).toBeVisible();
    await expect(page.getByText(/Stakeholders \(\d+\)/)).toBeVisible();
    await expect(page.getByText(/Custos \(\d+\)/)).toBeVisible();

    // Theme section (staff only).
    await expect(
      page.getByRole("heading", { name: /Temática \(classificação IA\)/i }),
    ).toBeVisible();
  });
});

test.describe("Project detail — client CBAC (M2)", () => {
  test("a client sees only the permitted category and no staff-only sections", async ({ page }) => {
    await login(page, ACCOUNTS.cliente1);
    await openProjectDetail(page);

    // CBAC grants cliente1 only the "conteudo_geral" category.
    await expect(page.getByText(/Conteúdo geral \(\d+\)/)).toBeVisible();
    await expect(page.getByText(/Stakeholders \(\d+\)/)).toHaveCount(0);
    await expect(page.getByText(/Custos \(\d+\)/)).toHaveCount(0);

    // Staff-only sections must be absent for a client.
    await expect(page.getByText("Cobertura")).toHaveCount(0);
    await expect(page.getByText(/Temática \(classificação IA\)/i)).toHaveCount(0);
  });
});
