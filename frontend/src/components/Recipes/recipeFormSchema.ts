import { z } from "zod"

export const recipeIngredientFormSchema = z.object({
  food_id: z.string().min(1, { message: "Selecione um alimento" }),
  food_name: z.string(),
  quantity_g: z
    .number({ message: "Quantidade é obrigatória" })
    .positive({ message: "Quantidade deve ser maior que 0" }),
})

export const recipeFormSchema = z.object({
  name: z.string().min(1, { message: "Nome da receita é obrigatório" }),
  yield_servings: z
    .number({ message: "Rendimento é obrigatório" })
    .positive({ message: "Rendimento deve ser maior que 0" }),
  ingredients: z
    .array(recipeIngredientFormSchema)
    .min(1, { message: "Adicione pelo menos um alimento" }),
})

export type RecipeFormData = z.infer<typeof recipeFormSchema>
