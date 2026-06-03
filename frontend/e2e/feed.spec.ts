import { test, expect } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

test.describe("Feed de Novidades (RF11)", () => {
  test("consultant reaches the feed from the cockpit and drills into a project", async ({ page }) => {
    await login(page, ACCOUNTS.consultor);
    await expect(page).toHaveURL(/\/portfolio\/cockpit$/);

    await page.getByRole("link", { name: "Novidades" }).click();
    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByRole("heading", { name: "Novidades" })).toBeVisible();

    // Seed has extractions on every project → the feed is non-empty.
    const event = page.getByRole("link", { name: /Freire Batista ADV/ }).first();
    await expect(event).toBeVisible();
    await event.click();
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: "Freire Batista ADV" })).toBeVisible();
  });

  test("a client sees only their own project's events in the feed", async ({ page }) => {
    await login(page, ACCOUNTS.cliente1);
    await expect(page).toHaveURL(/\/projects$/);

    await page.getByRole("link", { name: "Novidades" }).click();
    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByRole("heading", { name: "Novidades" })).toBeVisible();

    // cliente1 is linked only to Freire Batista ADV.
    await expect(page.getByText("Freire Batista ADV").first()).toBeVisible();
    await expect(page.getByText("Valença Odontologia")).toHaveCount(0);
    await expect(page.getByText("Kaka Jiu-Jitsu")).toHaveCount(0);
  });
});
