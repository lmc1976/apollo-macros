import { expect, test } from "@playwright/test"
import { createUser } from "./utils/privateApi"
import { randomEmail, randomFoodName, randomPassword } from "./utils/random"
import { logInUser } from "./utils/user"

test("Food Entries page is accessible and shows correct title", async ({
  page,
}) => {
  await page.goto("/food-entries")
  await expect(
    page.getByRole("heading", { name: "Food Entries" }),
  ).toBeVisible()
  await expect(
    page.getByText("Track what you eat and its macros"),
  ).toBeVisible()
})

test("Add Food Entry button is visible", async ({ page }) => {
  await page.goto("/food-entries")
  await expect(
    page.getByRole("button", { name: "Add Food Entry" }),
  ).toBeVisible()
})

test.describe("Food Entries management", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  let email: string
  const password = randomPassword()

  test.beforeAll(async () => {
    email = randomEmail()
    await createUser({ email, password })
  })

  test.beforeEach(async ({ page }) => {
    await logInUser(page, email, password)
    await page.goto("/food-entries")
  })

  test("Create a new food entry successfully", async ({ page }) => {
    const foodName = randomFoodName()

    await page.getByRole("button", { name: "Add Food Entry" }).click()
    await page.getByLabel("Food name").fill(foodName)
    await page.getByLabel("Quantity (g)").fill("120")
    await page.getByLabel("Calories (kcal)").fill("105")
    await page.getByLabel("Protein (g)").fill("1.3")
    await page.getByLabel("Carbohydrate (g)").fill("27")
    await page.getByLabel("Fat (g)").fill("0.4")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(
      page.getByText("Food entry created successfully"),
    ).toBeVisible()
    await expect(page.getByText(foodName)).toBeVisible()
  })

  test("Cancel food entry creation", async ({ page }) => {
    await page.getByRole("button", { name: "Add Food Entry" }).click()
    await page.getByLabel("Food name").fill("Test Food")
    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("Food name is required", async ({ page }) => {
    await page.getByRole("button", { name: "Add Food Entry" }).click()
    await page.getByLabel("Food name").fill("")
    await page.getByLabel("Food name").blur()

    await expect(page.getByText("Food name is required")).toBeVisible()
  })

  test.describe("Edit and Delete", () => {
    let foodName: string

    test.beforeEach(async ({ page }) => {
      foodName = randomFoodName()

      await page.getByRole("button", { name: "Add Food Entry" }).click()
      await page.getByLabel("Food name").fill(foodName)
      await page.getByLabel("Quantity (g)").fill("120")
      await page.getByLabel("Calories (kcal)").fill("105")
      await page.getByLabel("Protein (g)").fill("1.3")
      await page.getByLabel("Carbohydrate (g)").fill("27")
      await page.getByLabel("Fat (g)").fill("0.4")
      await page.getByRole("button", { name: "Save" }).click()
      await expect(
        page.getByText("Food entry created successfully"),
      ).toBeVisible()
      await expect(page.getByRole("dialog")).not.toBeVisible()
    })

    test("Edit a food entry successfully", async ({ page }) => {
      const foodRow = page.getByRole("row").filter({ hasText: foodName })
      await foodRow.getByRole("button").last().click()
      await page.getByRole("menuitem", { name: "Edit Food Entry" }).click()

      const updatedName = randomFoodName()
      await page.getByLabel("Food name").fill(updatedName)
      await page.getByRole("button", { name: "Save" }).click()

      await expect(
        page.getByText("Food entry updated successfully"),
      ).toBeVisible()
      await expect(page.getByText(updatedName)).toBeVisible()
    })

    test("Delete a food entry successfully", async ({ page }) => {
      const foodRow = page.getByRole("row").filter({ hasText: foodName })
      await foodRow.getByRole("button").last().click()
      await page.getByRole("menuitem", { name: "Delete Food Entry" }).click()

      await page.getByRole("button", { name: "Delete" }).click()

      await expect(
        page.getByText("The food entry was deleted successfully"),
      ).toBeVisible()
      await expect(page.getByText(foodName)).not.toBeVisible()
    })
  })
})

test.describe("Food Entries empty state", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Shows empty state message when no food entries exist", async ({
    page,
  }) => {
    const email = randomEmail()
    const password = randomPassword()
    await createUser({ email, password })
    await logInUser(page, email, password)

    await page.goto("/food-entries")

    await expect(
      page.getByText("You don't have any food entries yet"),
    ).toBeVisible()
    await expect(
      page.getByText("Log a new food entry to get started"),
    ).toBeVisible()
  })
})
