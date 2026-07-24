import type { UseFormReturn } from "react-hook-form"

import { FoodCombobox } from "@/components/Common/FoodCombobox"
import { RecipeCombobox } from "@/components/Common/RecipeCombobox"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DailyLogFormData } from "./dailyLogFormSchema"

interface DailyLogEntryFieldsProps {
  form: UseFormReturn<DailyLogFormData>
}

export function DailyLogEntryFields({ form }: DailyLogEntryFieldsProps) {
  const { control, watch, setValue } = form
  const entryType = watch("entry_type")

  return (
    <>
      <FormField
        control={control}
        name="entry_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Tipo <span className="text-destructive">*</span>
            </FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="food">Alimento</SelectItem>
                <SelectItem value="recipe">Receita</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {entryType === "food" ? (
        <>
          <FormField
            control={control}
            name="food_id"
            render={() => (
              <FormItem>
                <FormLabel>
                  Alimento <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <FoodCombobox
                    value={
                      watch("food_id")
                        ? {
                            id: watch("food_id") ?? "",
                            name: watch("food_name") ?? "",
                          }
                        : null
                    }
                    onChange={(food) => {
                      setValue("food_id", food.id, { shouldValidate: true })
                      setValue("food_name", food.name)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="quantity_g"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Quantidade (g) <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Quantidade (g)"
                    type="number"
                    step="any"
                    value={typeof field.value === "number" ? field.value : ""}
                    onChange={(e) => {
                      const raw = e.target.value
                      field.onChange(raw === "" ? null : Number(raw))
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      ) : (
        <>
          <FormField
            control={control}
            name="recipe_id"
            render={() => (
              <FormItem>
                <FormLabel>
                  Receita <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <RecipeCombobox
                    value={
                      watch("recipe_id")
                        ? {
                            id: watch("recipe_id") ?? "",
                            name: watch("recipe_name") ?? "",
                          }
                        : null
                    }
                    onChange={(recipe) => {
                      setValue("recipe_id", recipe.id, {
                        shouldValidate: true,
                      })
                      setValue("recipe_name", recipe.name)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="recipe_servings"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Porções <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 1, 0.5..."
                    type="number"
                    step="any"
                    value={typeof field.value === "number" ? field.value : ""}
                    onChange={(e) => {
                      const raw = e.target.value
                      field.onChange(raw === "" ? null : Number(raw))
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      <FormField
        control={control}
        name="entry_datetime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Data/hora <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input type="datetime-local" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="label"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rótulo</FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: Almoço, Pré-treino..."
                type="text"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
