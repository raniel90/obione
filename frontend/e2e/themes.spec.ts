import { test, expect, type Page } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

/**
 * "Doceria Rios" [gastronomy] has no client linked and starts with no theme
 * suggestion, so it is the cleanest project for the consultant generate flow.
 * The mock classifier is keyword-deterministic over the description.
 */
const PROJECT = "Doceria Rios";

async function openDoceria(page: Page) {
  await page.goto("/projects");
  await page.getByRole("row", { name: new RegExp(PROJECT) }).click();
  await expect(page.getByRole("heading", { name: PROJECT })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Domínio \(classificação IA\)/i }),
  ).toBeVisible();
}

test.describe("Themes / RF19 — consultant flow (M3)", () => {
  test("generates a suggestion, accepts it, and keeps a history trail", async ({ page }) => {
    await login(page, ACCOUNTS.consultor);
    await openDoceria(page);

    const suggest = page.getByRole("button", { name: /sugerir domínio/i });
    // Each suggestion card shows exactly one "confiança N%", so this count is a
    // proxy for the number of cards. Baseline ≥ 0 so the test is re-run safe
    // (prior runs accumulate suggestions on a live backend).
    const cards = page.getByText(/confiança \d+%/i);
    const baseline = await cards.count();

    // 1. Generate a suggestion — the card count must actually grow (causal:
    //    toasts auto-dismiss and are too flaky to assert in e2e).
    await suggest.click();
    await expect(cards).toHaveCount(baseline + 1);

    // 2. Accept the current (top, only) suggestion → its Aceitar button is the
    //    only one on screen (history cards have none). Wait for it to vanish
    //    before asserting the accepted state, to avoid racing the refetch.
    const accept = page.getByRole("button", { name: /^aceitar$/i });
    await expect(accept).toBeVisible();
    await accept.click();
    await expect(accept).toHaveCount(0);
    await expect(page.getByText(/✓ aceita/).first()).toBeVisible();

    // 3. Re-suggest: another card is added and the accepted one drops into the
    //    history trail (causal — count grows again, not just "heading exists").
    await suggest.click();
    await expect(cards).toHaveCount(baseline + 2);
    await expect(page.getByRole("heading", { name: /Histórico/i })).toBeVisible();

    // 4. Cross-screen: the accepted domain shows on the list row (gastronomy is
    //    the mock's deterministic answer for Doceria Rios' description).
    await page.goto("/projects");
    const row = page.getByRole("row", { name: new RegExp(PROJECT) });
    await expect(row.getByText("Gastronomia")).toBeVisible();
  });
});

test.describe("Themes / RF19 — client (M3)", () => {
  test("a client never sees the theme section", async ({ page }) => {
    await login(page, ACCOUNTS.cliente1);
    await page.goto("/projects");
    await page.getByRole("row", { name: /Freire Batista ADV/ }).click();
    await expect(page.getByRole("heading", { name: "Freire Batista ADV" })).toBeVisible();
    await expect(page.getByText(/Domínio \(classificação IA\)/i)).toHaveCount(0);
  });
});
