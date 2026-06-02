import { test, expect, type Page } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

const PROJECT = "Kaka Jiu-Jitsu";

async function openProjectVisibility(page: Page) {
  await page.goto("/projects");
  await page.getByRole("row", { name: new RegExp(PROJECT) }).click();
  await expect(page.getByRole("heading", { name: PROJECT })).toBeVisible();
  await page.getByRole("link", { name: /configurar visibilidade/i }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+\/visibility$/);
}

test.describe("Visibility config — CBAC (M4)", () => {
  test("consultant liberates a category and the linked client then sees it", async ({ page }) => {
    await login(page, ACCOUNTS.consultor);
    await openProjectVisibility(page);

    // Ensure "Conteúdo geral" is liberada (idempotent — re-run safe with a Switch).
    const sw = page.getByRole("switch", { name: /Conteúdo geral/i });
    if ((await sw.getAttribute("aria-checked")) !== "true") {
      await sw.click();
    }
    await expect(sw).toHaveAttribute("aria-checked", "true");

    // Switch users in-place: login() overwrites token + auth context.
    await login(page, ACCOUNTS.cliente3);
    await expect(page).toHaveURL(/\/projects$/);
    await page.getByRole("row", { name: new RegExp(PROJECT) }).click();
    await expect(page.getByRole("heading", { name: PROJECT })).toBeVisible();
    await expect(page.getByText(/Conteúdo geral \(\d+\)/)).toBeVisible();
  });

  test("a client cannot reach the visibility route", async ({ page }) => {
    await login(page, ACCOUNTS.cliente3);
    await page.getByRole("row", { name: new RegExp(PROJECT) }).click();
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/);
    const path = new URL(page.url()).pathname;
    await page.goto(`${path}/visibility`);
    // RequireRole bounces non-staff to "/", which redirects clients to /projects.
    await expect(page).toHaveURL(/\/projects$/);
  });
});
