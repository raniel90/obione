import { expect, type Page } from "@playwright/test";

/** Demo accounts created by `make seed-demo` (password is shared). */
export const PASSWORD = "demo12345678";

export const ACCOUNTS = {
  consultor: "consultor@obione.dev",
  admin: "admin@obione.dev",
  /** Linked to "Freire Batista ADV" [legal]; CBAC: sees only the "conteudo_geral" category. */
  cliente1: "cliente1@obione.dev",
  /** Linked to "Valença Odontologia" [health]; project 2 has an accepted theme suggestion. */
  cliente2: "cliente2@obione.dev",
  /** Linked to "Kaka Jiu-Jitsu" [sports]. */
  cliente3: "cliente3@obione.dev",
} as const;

/**
 * Log in through the real LoginPage form and wait until the app has navigated
 * away from /login. Returns once the post-login redirect has settled.
 */
export async function login(page: Page, email: string, password = PASSWORD): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/senha/i).fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}
