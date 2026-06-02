import { test, expect } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

test.describe("Portfolio cockpit (M5)", () => {
  test("consultant lands on the cockpit and drills into a theme's filtered list", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.consultor);
    // Consultant is redirected to the cockpit on login.
    await expect(page).toHaveURL(/\/portfolio\/cockpit$/);
    await expect(page.getByRole("heading", { name: "Cockpit do Portfólio" })).toBeVisible();

    // KPIs + theme table are present (seed has a "legal" project → "Jurídico" row).
    await expect(page.getByText("Por temática")).toBeVisible();
    const legalLink = page.getByRole("link", { name: "Jurídico" });
    await expect(legalLink).toBeVisible();

    // Drill into the theme → projects list filtered by that domain.
    await legalLink.click();
    await expect(page).toHaveURL(/\/projects\?domain=legal$/);
    await expect(page.getByText("Freire Batista ADV")).toBeVisible();
    // A non-legal project must not appear under the legal filter.
    await expect(page.getByText("Valença Odontologia")).toHaveCount(0);
  });

  test("a client cannot reach the cockpit", async ({ page }) => {
    await login(page, ACCOUNTS.cliente3);
    await page.goto("/portfolio/cockpit");
    // RequireRole bounces non-staff to "/", which redirects clients to /projects.
    await expect(page).toHaveURL(/\/projects$/);
  });
});
