import { z } from "zod"

export const dailyLogFormSchema = z
  .object({
    entry_type: z.enum(["food", "recipe"]),
    entry_datetime: z.string().min(1, { message: "Data/hora é obrigatória" }),
    label: z.string(),
    food_id: z.string(),
    food_name: z.string(),
    quantity_g: z.number().nullable(),
    recipe_id: z.string(),
    recipe_name: z.string(),
    recipe_servings: z.number().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.entry_type === "food") {
      if (!data.food_id) {
        ctx.addIssue({
          code: "custom",
          path: ["food_id"],
          message: "Selecione um alimento",
        })
      }
      if (data.quantity_g == null || data.quantity_g <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["quantity_g"],
          message: "Quantidade deve ser maior que 0",
        })
      }
    } else {
      if (!data.recipe_id) {
        ctx.addIssue({
          code: "custom",
          path: ["recipe_id"],
          message: "Selecione uma receita",
        })
      }
      if (data.recipe_servings == null || data.recipe_servings <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["recipe_servings"],
          message: "Porções deve ser maior que 0",
        })
      }
    }
  })

export type DailyLogFormData = z.infer<typeof dailyLogFormSchema>
