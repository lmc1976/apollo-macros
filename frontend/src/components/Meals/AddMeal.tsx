import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { type MealCreate, MealsService } from "@/client"
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
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { handleError, nowForDatetimeLocalInput } from "@/utils"
import { FoodEntryFields } from "./FoodEntryFields"
import { type MealFormData, mealFormSchema } from "./mealFormSchema"

const emptyDefaultValues = (): MealFormData => ({
  label: "",
  meal_datetime: nowForDatetimeLocalInput(),
  is_recipe: false,
  food_entries: [{ food_id: "", food_name: "", quantity_g: 0 }],
})

const AddMeal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<MealFormData>({
    resolver: zodResolver(mealFormSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: emptyDefaultValues(),
  })

  const mutation = useMutation({
    mutationFn: (data: MealCreate) =>
      MealsService.createMeal({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Refeição criada com sucesso")
      form.reset(emptyDefaultValues())
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] })
    },
  })

  const onSubmit = (data: MealFormData) => {
    mutation.mutate({
      label: data.label,
      meal_datetime: new Date(data.meal_datetime).toISOString(),
      is_recipe: data.is_recipe,
      food_entries: data.food_entries.map((entry) => ({
        food_id: entry.food_id,
        quantity_g: entry.quantity_g,
      })),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="my-4">
          <Plus className="mr-2" />
          Add Meal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Meal</DialogTitle>
          <DialogDescription>
            Crie uma refeição e adicione os alimentos consumidos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
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

export default AddMeal
