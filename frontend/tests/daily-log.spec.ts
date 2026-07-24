import { expect, test } from "@playwright/test"
import { createUser } from "./utils/privateApi"
import { randomEmail, randomPassword, randomRecipeName } from "./utils/random"
import { logInUser } from "./utils/user"

// Relies on the example foods seeded by the backend (see app/core/db.py).
const SEEDED_FOOD_NAME = "Banana prata"
const OTHER_SEEDED_FOOD_NAME = "Feijão carioca cozido"

test("Daily Log page is accessible and shows correct title", async ({
  page,
}) => {
  await page.goto("/daily-log")
  await expect(page.getByRole("heading", { name: "Daily Log" })).toBeVisible()
})

test("Add Entry button is visible", async ({ page }) => {
  await page.goto("/daily-log")
  await expect(page.getByRole("button", { name: "Add Entry" })).toBeVisible()
})

test.describe("Daily Log management", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  let email: string
  const password = randomPassword()

  test.beforeAll(async () => {
    email = randomEmail()
    await createUser({ email, password })
  })

  test.beforeEach(async ({ page }) => {
    await logInUser(page, email, password)
    await page.goto("/daily-log")
  })

  test("Create a meal with multiple items in one batch", async ({ page }) => {
    await page.getByRole("button", { name: "Add Entry" }).click()
    await page.getByLabel("Rótulo").fill("Almoço")

    await page.getByPlaceholder("Buscar alimento...").fill("Banana")
    await page.getByRole("button", { name: SEEDED_FOOD_NAME }).click()
    await page.getByLabel("Quantidade (g)").fill("100")
    await page.getByRole("button", { name: "Adicionar" }).click()

    await expect(page.getByText(`${SEEDED_FOOD_NAME} 100g`)).toBeVisible()

    await page.getByPlaceholder("Buscar alimento...").fill("Feijão")
    await page.getByRole("button", { name: OTHER_SEEDED_FOOD_NAME }).click()
    await page.getByLabel("Quantidade (g)").fill("150")
    await page.getByRole("button", { name: "Adicionar" }).click()

    await expect(page.getByText(`${OTHER_SEEDED_FOOD_NAME} 150g`)).toBeVisible()

    await page.getByRole("button", { name: "Confirmar" }).click()

    await expect(page.getByText("Registros criados com sucesso")).toBeVisible()
    await expect(page.getByText(/^Almoço - \d{2}:\d{2}$/)).toBeVisible()
    await expect(page.getByText(/^Total: /)).toBeVisible()
    await expect(page.getByText("Total do dia")).toBeVisible()

    const foodRow = page.getByRole("row").filter({ hasText: SEEDED_FOOD_NAME })
    await expect(foodRow).toBeVisible()
    const beansRow = page
      .getByRole("row")
      .filter({ hasText: OTHER_SEEDED_FOOD_NAME })
    await expect(beansRow).toBeVisible()
  })

  test("Cancel entry creation discards drafts", async ({ page }) => {
    await page.getByRole("button", { name: "Add Entry" }).click()
    await page.getByPlaceholder("Buscar alimento...").fill("Banana")
    await page.getByRole("button", { name: SEEDED_FOOD_NAME }).click()
    await page.getByLabel("Quantidade (g)").fill("100")
    await page.getByRole("button", { name: "Adicionar" }).click()
    await expect(page.getByText(`${SEEDED_FOOD_NAME} 100g`)).toBeVisible()

    await page.getByRole("button", { name: "Cancelar" }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
    await expect(page.getByText(SEEDED_FOOD_NAME)).not.toBeVisible()
  })

  test("Quick-add requires a food selection", async ({ page }) => {
    await page.getByRole("button", { name: "Add Entry" }).click()
    await page.getByRole("button", { name: "Adicionar" }).click()

    await expect(page.getByText("Selecione um alimento")).toBeVisible()
  })

  test("Create a recipe entry and expand its ingredient tree", async ({
    page,
  }) => {
    const recipeName = randomRecipeName()

    await page.goto("/recipes")
    await page.getByRole("button", { name: "Add Recipe" }).click()
    await page.getByLabel("Nome").fill(recipeName)
    await page.getByPlaceholder("Buscar alimento...").fill("Banana")
    await page.getByRole("button", { name: SEEDED_FOOD_NAME }).click()
    await page.getByPlaceholder("Qtd (g)").fill("100")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Receita criada com sucesso")).toBeVisible()

    await page.goto("/daily-log")
    await page.getByRole("button", { name: "Add Entry" }).click()
    await page.getByLabel("Alimento ou receita?").click()
    await page.getByRole("option", { name: "Receita" }).click()
    await page.getByPlaceholder("Buscar receita...").fill(recipeName)
    await page.getByRole("button", { name: recipeName }).click()
    await page.getByLabel("Porções").fill("1")
    await page.getByRole("button", { name: "Adicionar" }).click()
    await expect(page.getByText(`${recipeName} (1 porção(ões))`)).toBeVisible()

    await page.getByRole("button", { name: "Confirmar" }).click()
    await expect(page.getByText("Registros criados com sucesso")).toBeVisible()

    const entryRow = page.getByRole("row").filter({ hasText: recipeName })
    await expect(entryRow).toBeVisible()
    await entryRow.getByRole("button").first().click()
    await expect(page.getByText(SEEDED_FOOD_NAME)).toBeVisible()
  })

  test("Calendar picker opens", async ({ page }) => {
    await page.getByRole("button", { name: /\d{2}\/\d{2}\/\d{4}/ }).click()
    await expect(page.getByRole("grid")).toBeVisible()
  })

  test("Copy meal duplicates all its entries", async ({ page }) => {
    const label = "Almoço"

    await page.getByRole("button", { name: "Add Entry" }).click()
    await page.getByLabel("Rótulo").fill(label)
    await page.getByPlaceholder("Buscar alimento...").fill("Banana")
    await page.getByRole("button", { name: SEEDED_FOOD_NAME }).click()
    await page.getByLabel("Quantidade (g)").fill("100")
    await page.getByRole("button", { name: "Adicionar" }).click()
    await page.getByRole("button", { name: "Confirmar" }).click()
    await expect(page.getByText("Registros criados com sucesso")).toBeVisible()

    await page.getByRole("button", { name: "Copiar refeição" }).click()
    await page.getByLabel("Qual refeição (rótulo)?").fill(label)
    await page.getByRole("button", { name: "Copiar", exact: true }).click()

    await expect(page.getByText("Refeição copiada com sucesso")).toBeVisible()
    await expect(
      page.getByRole("row").filter({ hasText: SEEDED_FOOD_NAME }),
    ).toHaveCount(2)
  })

  test.describe("Edit and Delete", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("button", { name: "Add Entry" }).click()
      await page.getByPlaceholder("Buscar alimento...").fill("Banana")
      await page.getByRole("button", { name: SEEDED_FOOD_NAME }).click()
      await page.getByLabel("Quantidade (g)").fill("120")
      await page.getByRole("button", { name: "Adicionar" }).click()
      await page.getByRole("button", { name: "Confirmar" }).click()
      await expect(
        page.getByText("Registros criados com sucesso"),
      ).toBeVisible()
      await expect(page.getByRole("dialog")).not.toBeVisible()
    })

    test("Edit an entry successfully", async ({ page }) => {
      const entryRow = page
        .getByRole("row")
        .filter({ hasText: SEEDED_FOOD_NAME })
        .first()
      await entryRow.getByRole("button").last().click()
      await page.getByRole("menuitem", { name: "Edit Entry" }).click()

      await page.getByLabel("Quantidade (g)").fill("200")
      await page.getByRole("button", { name: "Save" }).click()

      await expect(
        page.getByText("Registro atualizado com sucesso"),
      ).toBeVisible()
    })

    test("Delete an entry successfully", async ({ page }) => {
      const entryRow = page
        .getByRole("row")
        .filter({ hasText: SEEDED_FOOD_NAME })
        .first()
      await entryRow.getByRole("button").last().click()
      await page.getByRole("menuitem", { name: "Delete Entry" }).click()

      await page.getByRole("button", { name: "Delete" }).click()

      await expect(
        page.getByText("O registro foi excluído com sucesso"),
      ).toBeVisible()
    })
  })
})

test.describe("Daily Log empty state", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Shows empty state message when no entries exist", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    await createUser({ email, password })
    await logInUser(page, email, password)

    await page.goto("/daily-log")

    await expect(page.getByText("No entries for this day")).toBeVisible()
  })
})
