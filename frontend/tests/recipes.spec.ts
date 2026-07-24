import { expect, test } from "@playwright/test"
import { createUser } from "./utils/privateApi"
import { randomEmail, randomPassword, randomRecipeName } from "./utils/random"
import { logInUser } from "./utils/user"

// Relies on the example foods seeded by the backend (see app/core/db.py).
const SEEDED_FOOD_NAME = "Banana prata"

test("Recipes page is accessible and shows correct title", async ({ page }) => {
  await page.goto("/recipes")
  await expect(page.getByRole("heading", { name: "Recipes" })).toBeVisible()
})

test("Add Recipe button is visible", async ({ page }) => {
  await page.goto("/recipes")
  await expect(page.getByRole("button", { name: "Add Recipe" })).toBeVisible()
})

test.describe("Recipes management", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  let email: string
  const password = randomPassword()

  test.beforeAll(async () => {
    email = randomEmail()
    await createUser({ email, password })
  })

  test.beforeEach(async ({ page }) => {
    await logInUser(page, email, password)
    await page.goto("/recipes")
  })

  test("Create a new recipe successfully", async ({ page }) => {
    const name = randomRecipeName()

    await page.getByRole("button", { name: "Add Recipe" }).click()
    await page.getByLabel("Nome").fill(name)
    await page.getByPlaceholder("Buscar alimento...").fill("Banana")
    await page.getByRole("button", { name: SEEDED_FOOD_NAME }).click()
    await page.getByPlaceholder("Qtd (g)").fill("120")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("Receita criada com sucesso")).toBeVisible()
    await expect(page.getByText(name)).toBeVisible()
  })

  test("Create a recipe with a custom yield and see it in the list", async ({
    page,
  }) => {
    const name = randomRecipeName()

    await page.getByRole("button", { name: "Add Recipe" }).click()
    await page.getByLabel("Nome").fill(name)
    await page.getByLabel("Rende quantas porções?").fill("2")
    await page.getByPlaceholder("Buscar alimento...").fill("Banana")
    await page.getByRole("button", { name: SEEDED_FOOD_NAME }).click()
    await page.getByPlaceholder("Qtd (g)").fill("120")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("Receita criada com sucesso")).toBeVisible()
    const recipeRow = page.getByRole("row").filter({ hasText: name })
    await expect(recipeRow.getByText("2 porções")).toBeVisible()
  })

  test("Cancel recipe creation", async ({ page }) => {
    await page.getByRole("button", { name: "Add Recipe" }).click()
    await page.getByLabel("Nome").fill("Test Recipe")
    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("Recipe name is required", async ({ page }) => {
    await page.getByRole("button", { name: "Add Recipe" }).click()
    await page.getByLabel("Nome").fill("")
    await page.getByLabel("Nome").blur()

    await expect(page.getByText("Nome da receita é obrigatório")).toBeVisible()
  })

  test.describe("Edit and Delete", () => {
    let name: string

    test.beforeEach(async ({ page }) => {
      name = randomRecipeName()

      await page.getByRole("button", { name: "Add Recipe" }).click()
      await page.getByLabel("Nome").fill(name)
      await page.getByPlaceholder("Buscar alimento...").fill("Banana")
      await page.getByRole("button", { name: SEEDED_FOOD_NAME }).click()
      await page.getByPlaceholder("Qtd (g)").fill("120")
      await page.getByRole("button", { name: "Save" }).click()
      await expect(page.getByText("Receita criada com sucesso")).toBeVisible()
      await expect(page.getByRole("dialog")).not.toBeVisible()
    })

    test("Edit a recipe successfully", async ({ page }) => {
      const recipeRow = page.getByRole("row").filter({ hasText: name })
      await recipeRow.getByRole("button").last().click()
      await page.getByRole("menuitem", { name: "Edit Recipe" }).click()

      const updatedName = randomRecipeName()
      await page.getByLabel("Nome").fill(updatedName)
      await page.getByRole("button", { name: "Save" }).click()

      await expect(
        page.getByText("Receita atualizada com sucesso"),
      ).toBeVisible()
      await expect(page.getByText(updatedName)).toBeVisible()
    })

    test("Delete a recipe successfully", async ({ page }) => {
      const recipeRow = page.getByRole("row").filter({ hasText: name })
      await recipeRow.getByRole("button").last().click()
      await page.getByRole("menuitem", { name: "Delete Recipe" }).click()

      await page.getByRole("button", { name: "Delete" }).click()

      await expect(
        page.getByText("A receita foi excluída com sucesso"),
      ).toBeVisible()
      await expect(page.getByText(name)).not.toBeVisible()
    })
  })
})

test.describe("Recipes empty state", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Shows empty state message when no recipes exist", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    await createUser({ email, password })
    await logInUser(page, email, password)

    await page.goto("/recipes")

    await expect(page.getByText("You don't have any recipes yet")).toBeVisible()
  })
})
