import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { type MealPublic, MealsService } from "@/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import {
  handleError,
  nowForDatetimeLocalInput,
  toDatetimeLocalInputValue,
} from "@/utils"
import { FoodEntryFields } from "./FoodEntryFields"
import { type MealFormData, mealFormSchema } from "./mealFormSchema"

interface EditMealProps {
  meal: MealPublic
  onSuccess: () => void
}

const EditMeal = ({ meal, onSuccess }: EditMealProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<MealFormData>({
    resolver: zodResolver(mealFormSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      label: meal.label,
      meal_datetime: meal.meal_datetime
        ? toDatetimeLocalInputValue(meal.meal_datetime)
        : nowForDatetimeLocalInput(),
      is_recipe: meal.is_recipe ?? false,
      food_entries: meal.food_entries.map((entry) => ({
        food_id: entry.food_id,
        food_name: entry.food_name,
        quantity_g: entry.quantity_g,
      })),
    },
  })

  const mutation = useMutation({
    mutationFn: (data: MealFormData) =>
      MealsService.updateMeal({
        id: meal.id,
        requestBody: {
          label: data.label,
          meal_datetime: new Date(data.meal_datetime).toISOString(),
          is_recipe: data.is_recipe,
          food_entries: data.food_entries.map((entry) => ({
            food_id: entry.food_id,
            quantity_g: entry.quantity_g,
          })),
        },
      }),
    onSuccess: () => {
      showSuccessToast("Refeição atualizada com sucesso")
      setIsOpen(false)
      onSuccess()
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] })
    },
  })

  const onSubmit = (data: MealFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Pencil />
        Edit Meal
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit Meal</DialogTitle>
              <DialogDescription>
                Atualize os dados da refeição e seus alimentos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nome <span className="text-destructive">*</span>
                    </FormLabel>
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

              <FormField
                control={form.control}
                name="meal_datetime"
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
                control={form.control}
                name="is_recipe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      É uma receita reutilizável
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FoodEntryFields form={form} />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Save
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditMeal
