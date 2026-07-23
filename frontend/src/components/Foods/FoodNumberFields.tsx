import type { Control } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FOOD_NUMBER_FIELD_SECTIONS, type FoodFormData } from "./foodFormSchema"

interface FoodNumberFieldsProps {
  control: Control<FoodFormData>
}

export function FoodNumberFields({ control }: FoodNumberFieldsProps) {
  return (
    <>
      {FOOD_NUMBER_FIELD_SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold">{section.title}</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {section.fields.map(({ name, label }) => (
              <FormField
                key={name}
                control={control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-normal">
                      {label}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={label}
                        type="number"
                        step="any"
                        value={
                          typeof field.value === "number" ? field.value : ""
                        }
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
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
