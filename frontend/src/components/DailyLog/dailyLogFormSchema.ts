import { z } from "zod"

export const dailyLogFormSchema = z
  .object({
    entry_type: z.enum(["food", "recipe"]),
    entry_datetime: z.string().min(1, { message: "Data/hora é obrigatória" }),
    label: z.string(),
    // The food_* and recipe_* fields are optional at the schema level
    // because react-hook-form unregisters whichever branch isn't rendered
    // (its fields become undefined, not their default "" / null) when the
    // user toggles entry_type. The superRefine below enforces which ones
    // are actually required, based on entry_type.
    food_id: z.string().optional(),
    food_name: z.string().optional(),
    quantity_g: z.number().nullable().optional(),
    recipe_id: z.string().optional(),
    recipe_name: z.string().optional(),
    recipe_servings: z.number().nullable().optional(),
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
