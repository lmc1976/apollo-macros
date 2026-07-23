import { expect, test } from "@playwright/test"
import { createUser } from "./utils/privateApi"
import { randomEmail, randomFoodName, randomPassword } from "./utils/random"
import { logInUser } from "./utils/user"

test("Foods page is accessible and shows correct title", async ({ page }) => {
  await page.goto("/foods")
  await expect(page.getByRole("heading", { name: "Foods" })).toBeVisible()
})

test("Add Food button is visible", async ({ page }) => {
  await page.goto("/foods")
  await expect(page.getByRole("button", { name: "Add Food" })).toBeVisible()
})

test.describe("Foods management", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  let email: string
  const password = randomPassword()

  test.beforeAll(async () => {
    email = randomEmail()
    await createUser({ email, password })
  })

  test.beforeEach(async ({ page }) => {
    await logInUser(page, email, password)
    await page.goto("/foods")
  })

  test("Create a new food successfully", async ({ page }) => {
    const name = randomFoodName()

    await page.getByRole("button", { name: "Add Food" }).click()
    await page.getByLabel("Nome").fill(name)
    await page.getByLabel("Calorias (kcal)").fill("150")
    await page.getByLabel("Proteína (g)").fill("5")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("Alimento criado com sucesso")).toBeVisible()
    await expect(page.getByText(name)).toBeVisible()
  })

  test("Cancel food creation", async ({ page }) => {
    await page.getByRole("button", { name: "Add Food" }).click()
    await page.getByLabel("Nome").fill("Test Food")
    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("Name is required", async ({ page }) => {
    await page.getByRole("button", { name: "Add Food" }).click()
    await page.getByLabel("Nome").fill("")
    await page.getByLabel("Nome").blur()

    await expect(page.getByText("Nome é obrigatório")).toBeVisible()
  })

  test.describe("Edit and Delete", () => {
    let name: string

    test.beforeEach(async ({ page }) => {
      name = randomFoodName()

      await page.getByRole("button", { name: "Add Food" }).click()
      await page.getByLabel("Nome").fill(name)
      await page.getByRole("button", { name: "Save" }).click()
      await expect(page.getByText("Alimento criado com sucesso")).toBeVisible()
      await expect(page.getByRole("dialog")).not.toBeVisible()
    })

    test("Edit a food successfully", async ({ page }) => {
      const foodRow = page.getByRole("row").filter({ hasText: name })
      await foodRow.getByRole("button").last().click()
      await page.getByRole("menuitem", { name: "Edit Food" }).click()

      const updatedName = randomFoodName()
      await page.getByLabel("Nome").fill(updatedName)
      await page.getByRole("button", { name: "Save" }).click()

      await expect(
        page.getByText("Alimento atualizado com sucesso"),
      ).toBeVisible()
      await expect(page.getByText(updatedName)).toBeVisible()
    })

    test("Delete a food successfully", async ({ page }) => {
      const foodRow = page.getByRole("row").filter({ hasText: name })
      await foodRow.getByRole("button").last().click()
      await page.getByRole("menuitem", { name: "Delete Food" }).click()

      await page.getByRole("button", { name: "Delete" }).click()

      await expect(
        page.getByText("O alimento foi excluído com sucesso"),
      ).toBeVisible()
      await expect(page.getByText(name)).not.toBeVisible()
    })
  })
})
