import { z } from "zod"

export const foodEntryFormSchema = z.object({
  food_id: z.string().min(1, { message: "Selecione um alimento" }),
  food_name: z.string(),
  quantity_g: z
    .number({ message: "Quantidade é obrigatória" })
    .positive({ message: "Quantidade deve ser maior que 0" }),
})

export const mealFormSchema = z.object({
  label: z.string().min(1, { message: "Nome da refeição é obrigatório" }),
  meal_datetime: z.string().min(1, { message: "Data/hora é obrigatória" }),
  is_recipe: z.boolean(),
  food_entries: z
    .array(foodEntryFormSchema)
    .min(1, { message: "Adicione pelo menos um alimento" }),
})

export type MealFormData = z.infer<typeof mealFormSchema>
