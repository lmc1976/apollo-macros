import { expect, test } from "@playwright/test"
import { createUser } from "./utils/privateApi"
import { randomEmail, randomPassword, randomRecipeName } from "./utils/random"
import { logInUser } from "./utils/user"

// Relies on the example foods seeded by the backend (see app/core/db.py).
const SEEDED_FOOD_NAME = "Banana prata"

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

  test("Create a food entry successfully", async ({ page }) => {
    await page.getByRole("button", { name: "Add Entry" }).click()
    await page.getByPlaceholder("Buscar alimento...").fill("Banana")
    await page.getByRole("button", { name: SEEDED_FOOD_NAME }).click()
    await page.getByLabel("Quantidade (g)").fill("120")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("Registro criado com sucesso")).toBeVisible()
    await expect(page.getByText(SEEDED_FOOD_NAME)).toBeVisible()
  })

  test("Cancel entry creation", async ({ page }) => {
    await page.getByRole("button", { name: "Add Entry" }).click()
    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("Create a recipe entry and expand its ingredient tree", async ({
    page,
  }) => {
    const recipeName = randomRecipeName()

    await page.goto("/recipes")
    await page.getByRole("button", { name: "Add Recipe" }).click()
    await page.getByLabel("Nome", { exact: true }).fill(recipeName)
    await page.getByPlaceholder("Buscar alimento...").fill("Banana")
    await page.getByRole("button", { name: SEEDED_FOOD_NAME }).click()
    await page.getByPlaceholder("Qtd (g)").fill("100")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Receita criada com sucesso")).toBeVisible()

    await page.goto("/daily-log")
    await page.getByRole("button", { name: "Add Entry" }).click()
    await page.getByLabel("Tipo").click()
    await page.getByRole("option", { name: "Receita" }).click()
    await page.getByPlaceholder("Buscar receita...").fill(recipeName)
    await page.getByRole("button", { name: recipeName }).click()
    await page.getByLabel("Porções").fill("1")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("Registro criado com sucesso")).toBeVisible()

    const entryRow = page.getByRole("row").filter({ hasText: recipeName })
    await expect(entryRow).toBeVisible()
    await entryRow.getByRole("button").first().click()
    await expect(page.getByText(SEEDED_FOOD_NAME)).toBeVisible()
  })

  test.describe("Edit and Delete", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("button", { name: "Add Entry" }).click()
      await page.getByPlaceholder("Buscar alimento...").fill("Banana")
      await page.getByRole("button", { name: SEEDED_FOOD_NAME }).click()
      await page.getByLabel("Quantidade (g)").fill("120")
      await page.getByRole("button", { name: "Save" }).click()
      await expect(page.getByText("Registro criado com sucesso")).toBeVisible()
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

    await expect(
      page.getByText("You don't have any daily log entries yet"),
    ).toBeVisible()
  })
})
