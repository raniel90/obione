import { test, expect } from "@playwright/test";
import { ACCOUNTS, PASSWORD, login } from "./helpers";

test.describe("Login screen (M1)", () => {
  test("rejects invalid credentials with an error message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(ACCOUNTS.consultor);
    await page.getByLabel(/senha/i).fill("wrong-password");
    await page.getByRole("button", { name: /entrar/i }).click();

    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("sends a consultant to the portfolio cockpit", async ({ page }) => {
    await login(page, ACCOUNTS.consultor);
    await expect(page).toHaveURL(/\/portfolio\/cockpit$/);
  });

  test("sends a client to the projects list", async ({ page }) => {
    await login(page, ACCOUNTS.cliente1);
    await expect(page).toHaveURL(/\/projects$/);
  });

  test("a demo-account button logs in with one click (dev)", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /consultor consultor@obione\.dev/i }).click();
    await expect(page).toHaveURL(/\/portfolio\/cockpit$/);
  });

  test("redirects to /login when the stored token is invalid", async ({ page }) => {
    await login(page, ACCOUNTS.consultor);
    await expect(page).toHaveURL(/\/portfolio\/cockpit$/);

    // Corrupt the JWT and reload — AuthProvider must bounce to /login.
    await page.evaluate(() => localStorage.setItem("obione_token", "not-a-valid-jwt"));
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("Login form validation (M1)", () => {
  test("rejects an invalid email format client-side", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByLabel(/senha/i).fill(PASSWORD);
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page.getByText(/e-mail inválido/i)).toBeVisible();
  });
});
