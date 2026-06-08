import { test, expect } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

// Conectora — cross-project synthesis per temática. Backend LLM_PROVIDER=mock
// + seed (legal has N=2: Freire Batista ADV + Dinoah ADV, lessons enriched).
// MUTATES (generates + publishes a legal synthesis); asserts presence, not
// counts. `make seed-demo` purges the demo consultor's syntheses on reseed.
test.describe("Conectora — síntese cross-projeto (temática)", () => {
  test("consultant generates and publishes a legal synthesis; client reads it", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.consultor);
    await expect(page).toHaveURL(/\/portfolio\/cockpit$/);

    await expect(
      page.getByRole("heading", { name: "Sínteses por domínio" }),
    ).toBeVisible();

    // Pick the "legal" domain (N=2) in the panel's domain select.
    await page.getByLabel("Domínio").click();
    await page.getByRole("option", { name: "Jurídico" }).click();

    // Generate → a draft synthesis appears with the three blocks.
    // (Body anonymisation is asserted at the backend/unit level.)
    await page.getByRole("button", { name: /gerar com ia/i }).click();
    await expect(page.getByText("Padrões recorrentes").first()).toBeVisible({ timeout: 15000 });

    // Publish the draft (trigger → confirm in the dialog).
    await page.getByRole("button", { name: "Publicar" }).first().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Publicar" }).click();
    await expect(page.getByText("publicado").first()).toBeVisible();

    // Client of a legal project reads the published synthesis on the detail.
    await login(page, ACCOUNTS.cliente1);
    await expect(page).toHaveURL(/\/projects$/);
    await page.getByRole("row", { name: /Freire Batista ADV/ }).click();
    await expect(page.getByRole("heading", { name: "Freire Batista ADV" })).toBeVisible();

    const synthesisHeading = page.getByRole("heading", { name: "Síntese do domínio" });
    await synthesisHeading.scrollIntoViewIfNeeded();
    await expect(synthesisHeading).toBeVisible();
    await expect(page.getByText("Padrões recorrentes").first()).toBeVisible();
    // Client never sees the generator.
    await expect(page.getByRole("button", { name: /gerar com ia/i })).toHaveCount(0);
  });
});
