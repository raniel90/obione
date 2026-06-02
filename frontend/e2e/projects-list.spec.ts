import { test, expect } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

test.describe("Projects list — profile-aware (M2)", () => {
  test("a consultant sees every demo project", async ({ page }) => {
    await login(page, ACCOUNTS.consultor);
    await page.goto("/projects");

    await expect(page.getByRole("heading", { name: "Projetos" })).toBeVisible();
    await expect(page.getByText("Freire Batista ADV")).toBeVisible();
    await expect(page.getByText("Valença Odontologia")).toBeVisible();
    await expect(page.getByText("Kaka Jiu-Jitsu")).toBeVisible();
    await expect(page.getByText("Doceria Rios")).toBeVisible();
  });

  test("a client sees only their linked project", async ({ page }) => {
    await login(page, ACCOUNTS.cliente1);
    await expect(page).toHaveURL(/\/projects$/);

    await expect(page.getByText("Freire Batista ADV")).toBeVisible();
    await expect(page.getByText("Valença Odontologia")).toHaveCount(0);
    await expect(page.getByText("Kaka Jiu-Jitsu")).toHaveCount(0);
    await expect(page.getByText("Doceria Rios")).toHaveCount(0);
  });

  test("clicking a row opens the project detail", async ({ page }) => {
    await login(page, ACCOUNTS.consultor);
    await page.goto("/projects");
    await page.getByRole("row", { name: /Freire Batista ADV/ }).click();

    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: "Freire Batista ADV" })).toBeVisible();
  });

  test("a client cannot reach the portfolio cockpit (role guard)", async ({ page }) => {
    await login(page, ACCOUNTS.cliente1);
    await page.goto("/portfolio/cockpit");
    // RequireRole bounces non-staff back to "/", which redirects clients to /projects.
    await expect(page).toHaveURL(/\/projects$/);
  });
});
