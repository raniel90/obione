import { test, expect } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

const PROJECT = "Freire Batista ADV";

test.describe("Comments — RF10", () => {
  test("a client can post a comment on their project and see it", async ({ page }) => {
    await login(page, ACCOUNTS.cliente1);
    await page.getByRole("row", { name: new RegExp(PROJECT) }).click();
    await expect(page.getByRole("heading", { name: PROJECT })).toBeVisible();

    const body = `Comentário do cliente ${Date.now()}`;
    await page.getByLabel("Comentário").fill(body);
    await page.getByRole("button", { name: "Comentar" }).click();
    await expect(page.getByText(body)).toBeVisible();
  });

  test("a consultant can edit and delete a comment (moderation)", async ({ page }) => {
    await login(page, ACCOUNTS.consultor);
    await page.goto("/projects");
    await page.getByRole("row", { name: new RegExp(PROJECT) }).click();
    await expect(page.getByRole("heading", { name: PROJECT })).toBeVisible();

    const body = `Comentário consultor ${Date.now()}`;
    await page.getByLabel("Comentário").fill(body);
    await page.getByRole("button", { name: "Comentar" }).click();
    await expect(page.getByText(body)).toBeVisible();

    const item = page.locator("li", { hasText: body });
    await item.getByRole("button", { name: "Editar" }).click();
    const edited = `${body} (editado e2e)`;
    // After clicking "Editar" the li re-renders with only the CommentForm (body text gone).
    // Locate the editing li by the "Salvar" button it uniquely contains.
    const editingItem = page.locator("li").filter({ has: page.getByRole("button", { name: "Salvar" }) });
    await editingItem.getByLabel("Comentário").fill(edited);
    await editingItem.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText(edited)).toBeVisible();

    const editedItem = page.locator("li", { hasText: edited });
    await editedItem.getByRole("button", { name: "Excluir" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByText(edited)).toHaveCount(0);
  });
});
