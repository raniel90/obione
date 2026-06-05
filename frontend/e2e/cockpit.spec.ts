import { test, expect } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

test.describe("Portfolio cockpit (M5)", () => {
  test("consultant lands on the cockpit and drills into a domain's filtered list", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.consultor);
    // Consultant is redirected to the cockpit on login.
    await expect(page).toHaveURL(/\/portfolio\/cockpit$/);
    await expect(page.getByRole("heading", { name: "Cockpit", exact: true })).toBeVisible();

    // KPIs + domain table are present (seed has a "legal" project → "Jurídico" row).
    await expect(page.getByRole("heading", { name: "Por domínio", exact: true })).toBeVisible();
    const legalLink = page.getByRole("link", { name: "Jurídico" });
    await expect(legalLink).toBeVisible();

    // Drill into the theme → projects list filtered by that domain.
    await legalLink.click();
    await expect(page).toHaveURL(/\/projects\?domain=legal$/);
    await expect(page.getByText("Freire Batista ADV")).toBeVisible();
    // A non-legal project must not appear under the legal filter.
    await expect(page.getByText("Valença Odontologia")).toHaveCount(0);
  });

  test("consultant sees the coverage heatmap and drills a cell to a project", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.consultor);
    await expect(page).toHaveURL(/\/portfolio\/cockpit$/);

    // The heatmap section + an MPO dimension column header are present.
    await expect(
      page.getByRole("heading", { name: "Cobertura por categoria" }),
    ).toBeVisible();
    await expect(page.getByText("Riscos", { exact: true })).toBeVisible();

    // A project row header links to that project's detail.
    const firstRow = page.getByRole("rowheader").first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/);
  });

  test("a client cannot reach the cockpit", async ({ page }) => {
    await login(page, ACCOUNTS.cliente3);
    await page.goto("/portfolio/cockpit");
    // RequireRole bounces non-staff to "/", which redirects clients to /projects.
    await expect(page).toHaveURL(/\/projects$/);
  });
});
