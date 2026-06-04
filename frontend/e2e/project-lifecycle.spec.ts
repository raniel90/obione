import { test, expect } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

// This spec MUTATES data (creates a project). It uses a fixed name and never
// asserts global counts; re-runs just create another project. `make seed-demo`
// purges demo entities on reseed. Requires backend LLM_PROVIDER=mock.
const DESCRIPTION =
  "Consultoria de marketing digital para uma clínica odontológica em Valença-BA. " +
  "O projeto cobre objetivos de captação de pacientes, stakeholders (sócios e equipe), " +
  "escopo planejado e executado, cronograma com marcos, custos estimados e realizados, " +
  "riscos identificados e lições aprendidas ao longo da execução do plano de marca.";

test.describe("Project lifecycle via UI (RF03/RF05)", () => {
  test("consultant registers a project, runs extraction and links a client", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.consultor);

    // 1. Cadastro
    await page.goto("/projects");
    await page.getByRole("link", { name: /novo projeto/i }).click();
    await expect(page).toHaveURL(/\/projects\/new$/);

    await page.getByLabel("Nome").fill("E2E Lifecycle Projeto");
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Jurídico" }).click();
    await page.getByLabel(/descrição/i).fill(DESCRIPTION);
    await page.getByRole("button", { name: /criar projeto/i }).click();

    // 2. Lands on the new project's detail (no extraction yet)
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/);
    await expect(
      page.getByRole("heading", { name: "E2E Lifecycle Projeto" }),
    ).toBeVisible();
    await expect(page.getByText(/extração ainda não executada/i)).toBeVisible();

    // 3. Executar extração → 44 atributos aparecem
    await page.getByRole("button", { name: /executar extração/i }).click();
    await expect(page.getByText(/Conteúdo geral/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/extração ainda não executada/i)).toBeHidden();

    // 4. Vincular cliente
    await page.getByRole("button", { name: /vincular cliente/i }).click();
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /cliente1@obione\.dev/ }).click();
    await page.getByRole("button", { name: /^vincular$/i }).click();
    await expect(page.getByText(/cliente vinculado/i)).toBeVisible();

    // 5. Editar o projeto
    await page.getByRole("button", { name: /^editar$/i }).click();
    const nameField = page.getByLabel("Nome");
    await nameField.fill("E2E Lifecycle Projeto (editado)");
    await page.getByRole("button", { name: /^salvar$/i }).click();
    await expect(
      page.getByRole("heading", { name: "E2E Lifecycle Projeto (editado)" }),
    ).toBeVisible();

    // 6. Excluir o projeto (limpa o que o teste criou) → volta à lista
    await page.getByRole("button", { name: /^excluir$/i }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: /^excluir$/i }).click();
    await expect(page).toHaveURL(/\/projects$/);
  });

  test("a client does not see the registration or lifecycle actions", async ({ page }) => {
    await login(page, ACCOUNTS.cliente1);
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole("link", { name: /novo projeto/i })).toHaveCount(0);

    await page.getByRole("row", { name: /Freire Batista ADV/ }).click();
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/);
    await expect(page.getByRole("button", { name: /vincular cliente/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /executar extração/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^editar$/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^excluir$/i })).toHaveCount(0);
  });
});
