import { expect, test } from "@playwright/test"
import { createUser } from "./utils/privateApi"
import { randomEmail, randomMealLabel, randomPassword } from "./utils/random"
import { logInUser } from "./utils/user"

// Relies on the example foods seeded by the backend (see app/core/db.py).
const SEEDED_FOOD_NAME = "Banana prata"

test("Meals page is accessible and shows correct title", async ({ page }) => {
  await page.goto("/meals")
  await expect(page.getByRole("heading", { name: "Meals" })).toBeVisible()
})

test("Add Meal button is visible", async ({ page }) => {
  await page.goto("/meals")
  await expect(page.getByRole("button", { name: "Add Meal" })).toBeVisible()
})

test.describe("Meals management", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  let email: string
  const password = randomPassword()

  test.beforeAll(async () => {
    email = randomEmail()
    await createUser({ email, password })
  })

  test.beforeEach(async ({ page }) => {
    await logInUser(page, email, password)
    await page.goto("/meals")
  })

  test("Create a new meal successfully", async ({ page }) => {
    const label = randomMealLabel()

    await page.getByRole("button", { name: "Add Meal" }).click()
    await page.getByLabel("Nome").fill(label)
    await page.getByPlaceholder("Buscar alimento...").fill("Banana")
    await page.getByRole("button", { name: SEEDED_FOOD_NAME }).click()
    await page.getByPlaceholder("Qtd (g)").fill("120")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("Refeição criada com sucesso")).toBeVisible()
    await expect(page.getByText(label)).toBeVisible()
  })

  test("Cancel meal creation", async ({ page }) => {
    await page.getByRole("button", { name: "Add Meal" }).click()
    await page.getByLabel("Nome").fill("Refeição de teste")
    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("Meal name is required", async ({ page }) => {
    await page.getByRole("button", { name: "Add Meal" }).click()
    await page.getByLabel("Nome").fill("")
    await page.getByLabel("Nome").blur()

    await expect(page.getByText("Nome da refeição é obrigatório")).toBeVisible()
  })

  test.describe("Edit and Delete", () => {
    let label: string

    test.beforeEach(async ({ page }) => {
      label = randomMealLabel()

      await page.getByRole("button", { name: "Add Meal" }).click()
      await page.getByLabel("Nome").fill(label)
      await page.getByPlaceholder("Buscar alimento...").fill("Banana")
      await page.getByRole("button", { name: SEEDED_FOOD_NAME }).click()
      await page.getByPlaceholder("Qtd (g)").fill("120")
      await page.getByRole("button", { name: "Save" }).click()
      await expect(page.getByText("Refeição criada com sucesso")).toBeVisible()
      await expect(page.getByRole("dialog")).not.toBeVisible()
    })

    test("Edit a meal successfully", async ({ page }) => {
      const mealRow = page.getByRole("row").filter({ hasText: label })
      await mealRow.getByRole("button").last().click()
      await page.getByRole("menuitem", { name: "Edit Meal" }).click()

      const updatedLabel = randomMealLabel()
      await page.getByLabel("Nome").fill(updatedLabel)
      await page.getByRole("button", { name: "Save" }).click()

      await expect(
        page.getByText("Refeição atualizada com sucesso"),
      ).toBeVisible()
      await expect(page.getByText(updatedLabel)).toBeVisible()
    })

    test("Delete a meal successfully", async ({ page }) => {
      const mealRow = page.getByRole("row").filter({ hasText: label })
      await mealRow.getByRole("button").last().click()
      await page.getByRole("menuitem", { name: "Delete Meal" }).click()

      await page.getByRole("button", { name: "Delete" }).click()

      await expect(
        page.getByText("A refeição foi excluída com sucesso"),
      ).toBeVisible()
      await expect(page.getByText(label)).not.toBeVisible()
    })
  })
})

test.describe("Meals empty state", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Shows empty state message when no meals exist", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    await createUser({ email, password })
    await logInUser(page, email, password)

    await page.goto("/meals")

    await expect(page.getByText("You don't have any meals yet")).toBeVisible()
    await expect(page.getByText("Add a new meal to get started")).toBeVisible()
  })
})
