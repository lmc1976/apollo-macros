import { z } from "zod"

const nonNegative = () =>
  z
    .number({ message: "Valor inválido" })
    .min(0, { message: "Deve ser 0 ou maior" })
    .nullable()

const positive = () =>
  z
    .number({ message: "Valor inválido" })
    .positive({ message: "Deve ser maior que 0" })
    .nullable()

export const foodFormSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  food_group: z.string().nullable(),
  source: z.string().nullable(),

  energy_kcal: nonNegative(),
  protein_g: nonNegative(),
  carbohydrate_g: nonNegative(),
  lipid_g: nonNegative(),

  saturated_fat_g: nonNegative(),
  monounsaturated_fat_g: nonNegative(),
  polyunsaturated_fat_g: nonNegative(),

  cholesterol_mg: nonNegative(),
  fiber_g: nonNegative(),

  sodium_mg: nonNegative(),
  calcium_mg: nonNegative(),
  magnesium_mg: nonNegative(),
  phosphorus_mg: nonNegative(),
  iron_mg: nonNegative(),
  potassium_mg: nonNegative(),
  copper_mg: nonNegative(),
  zinc_mg: nonNegative(),
  manganese_mg: nonNegative(),

  retinol_mcg: nonNegative(),
  thiamine_mg: nonNegative(),
  riboflavin_mg: nonNegative(),
  pyridoxine_mg: nonNegative(),
  niacin_mg: nonNegative(),
  vitamin_c_mg: nonNegative(),

  price_brl: positive(),
  price_reference_g: positive(),
})

export type FoodFormData = z.infer<typeof foodFormSchema>

export const FOOD_EMPTY_DEFAULT_VALUES: FoodFormData = {
  name: "",
  food_group: null,
  source: null,
  energy_kcal: null,
  protein_g: null,
  carbohydrate_g: null,
  lipid_g: null,
  saturated_fat_g: null,
  monounsaturated_fat_g: null,
  polyunsaturated_fat_g: null,
  cholesterol_mg: null,
  fiber_g: null,
  sodium_mg: null,
  calcium_mg: null,
  magnesium_mg: null,
  phosphorus_mg: null,
  iron_mg: null,
  potassium_mg: null,
  copper_mg: null,
  zinc_mg: null,
  manganese_mg: null,
  retinol_mcg: null,
  thiamine_mg: null,
  riboflavin_mg: null,
  pyridoxine_mg: null,
  niacin_mg: null,
  vitamin_c_mg: null,
  price_brl: null,
  price_reference_g: null,
}

export const FOOD_NUMBER_FIELD_SECTIONS: {
  title: string
  fields: { name: keyof FoodFormData; label: string }[]
}[] = [
  {
    title: "Macros (por 100g)",
    fields: [
      { name: "energy_kcal", label: "Calorias (kcal)" },
      { name: "protein_g", label: "Proteína (g)" },
      { name: "carbohydrate_g", label: "Carboidrato (g)" },
      { name: "lipid_g", label: "Gordura total (g)" },
      { name: "fiber_g", label: "Fibra (g)" },
    ],
  },
  {
    title: "Gorduras e colesterol",
    fields: [
      { name: "saturated_fat_g", label: "Gordura saturada (g)" },
      { name: "monounsaturated_fat_g", label: "Gordura monoinsaturada (g)" },
      { name: "polyunsaturated_fat_g", label: "Gordura poli-insaturada (g)" },
      { name: "cholesterol_mg", label: "Colesterol (mg)" },
    ],
  },
  {
    title: "Minerais (mg)",
    fields: [
      { name: "sodium_mg", label: "Sódio" },
      { name: "calcium_mg", label: "Cálcio" },
      { name: "magnesium_mg", label: "Magnésio" },
      { name: "phosphorus_mg", label: "Fósforo" },
      { name: "iron_mg", label: "Ferro" },
      { name: "potassium_mg", label: "Potássio" },
      { name: "copper_mg", label: "Cobre" },
      { name: "zinc_mg", label: "Zinco" },
      { name: "manganese_mg", label: "Manganês" },
    ],
  },
  {
    title: "Vitaminas",
    fields: [
      { name: "retinol_mcg", label: "Retinol (mcg)" },
      { name: "thiamine_mg", label: "Tiamina (mg)" },
      { name: "riboflavin_mg", label: "Riboflavina (mg)" },
      { name: "pyridoxine_mg", label: "Piridoxina (mg)" },
      { name: "niacin_mg", label: "Niacina (mg)" },
      { name: "vitamin_c_mg", label: "Vitamina C (mg)" },
    ],
  },
  {
    title: "Preço",
    fields: [
      { name: "price_brl", label: "Preço (R$)" },
      { name: "price_reference_g", label: "Referente a (g)" },
    ],
  },
]
