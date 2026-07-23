import { Plus, Trash2 } from "lucide-react"
import { type UseFormReturn, useFieldArray } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FoodCombobox } from "./FoodCombobox"
import type { MealFormData } from "./mealFormSchema"

interface FoodEntryFieldsProps {
  form: UseFormReturn<MealFormData>
}

export function FoodEntryFields({ form }: FoodEntryFieldsProps) {
  const { control, watch, setValue, formState } = form
  const { fields, append, remove } = useFieldArray({
    control,
    name: "food_entries",
  })

  return (
    <div className="flex flex-col gap-3">
      <FormLabel>
        Alimentos <span className="text-destructive">*</span>
      </FormLabel>
      {fields.map((field, index) => {
        const foodId = watch(`food_entries.${index}.food_id`)
        const foodName = watch(`food_entries.${index}.food_name`)
        const foodIdError = formState.errors.food_entries?.[index]?.food_id

        return (
          <div key={field.id} className="flex items-start gap-2">
            <div className="flex-1">
              <FoodCombobox
                value={foodId ? { id: foodId, name: foodName } : null}
                onChange={(food) => {
                  setValue(`food_entries.${index}.food_id`, food.id, {
                    shouldValidate: true,
                  })
                  setValue(`food_entries.${index}.food_name`, food.name)
                }}
              />
              {foodIdError && (
                <p className="text-destructive mt-1 text-sm">
                  {foodIdError.message}
                </p>
              )}
            </div>

            <div className="w-28">
              <FormField
                control={control}
                name={`food_entries.${index}.quantity_g`}
                render={({ field: qtyField }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Qtd (g)"
                        type="number"
                        step="any"
                        {...qtyField}
                        onChange={(e) =>
                          qtyField.onChange(e.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={fields.length === 1}
              onClick={() => remove(index)}
            >
              <Trash2 />
              <span className="sr-only">Remover alimento</span>
            </Button>
          </div>
        )
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => append({ food_id: "", food_name: "", quantity_g: 0 })}
      >
        <Plus className="mr-2 size-4" />
        Adicionar alimento
      </Button>
    </div>
  )
}
