import { test, expect } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

const PROJECT = "Freire Batista ADV";

// .serial: the client test depends on the consultant test having published a
// draft on this project — make the ordering explicit and retry-safe.
test.describe.serial("Drafts / IA — RF12", () => {
  test("consultant generates, edits and publishes a draft", async ({ page }) => {
    await login(page, ACCOUNTS.consultor);
    await page.goto("/projects");
    await page.getByRole("row", { name: new RegExp(PROJECT) }).click();
    await expect(page.getByRole("heading", { name: PROJECT })).toBeVisible();

    // Generate a batch of drafts (deterministic mock).
    await page.getByRole("button", { name: /gerar com ia/i }).click();
    await expect(page.getByText("rascunho").first()).toBeVisible();

    // Edit the first editable draft. After clicking "Editar" the <li> swaps to
    // the form, so re-locate the editing item via its "Salvar" button.
    const firstEditable = page
      .locator("li", { has: page.getByRole("button", { name: "Editar" }) })
      .first();
    await firstEditable.getByRole("button", { name: "Editar" }).click();
    const body = `Corpo editado e2e ${Date.now()}`;
    const editingItem = page.locator("li", { has: page.getByRole("button", { name: "Salvar" }) });
    await editingItem.getByLabel("Corpo do draft").fill(body);
    await editingItem.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText(body)).toBeVisible();

    // Publish a draft → it becomes "publicado".
    const toPublish = page
      .locator("li", { has: page.getByRole("button", { name: "Publicar" }) })
      .first();
    await toPublish.getByRole("button", { name: "Publicar" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Publicar" }).click();
    await expect(page.getByText("publicado").first()).toBeVisible();
  });

  test("a client sees published drafts but no rascunhos and no generate button", async ({ page }) => {
    await login(page, ACCOUNTS.cliente1);
    await page.getByRole("row", { name: new RegExp(PROJECT) }).click();
    await expect(page.getByRole("heading", { name: PROJECT })).toBeVisible();

    // The consultant test published at least one draft on this project.
    await expect(page.getByText("publicado").first()).toBeVisible();
    await expect(page.getByText("rascunho")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /gerar com ia/i })).toHaveCount(0);
  });
});
