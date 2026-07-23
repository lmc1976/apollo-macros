import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { type FoodPublic, FoodsService } from "@/client"
import { Button } from "@/components/ui/button"
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
import { handleError } from "@/utils"
import { FoodNumberFields } from "./FoodNumberFields"
import { type FoodFormData, foodFormSchema } from "./foodFormSchema"

interface EditFoodProps {
  food: FoodPublic
  onSuccess: () => void
}

const EditFood = ({ food, onSuccess }: EditFoodProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<FoodFormData>({
    resolver: zodResolver(foodFormSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: food.name,
      food_group: food.food_group ?? null,
      source: food.source ?? null,
      energy_kcal: food.energy_kcal ?? null,
      protein_g: food.protein_g ?? null,
      carbohydrate_g: food.carbohydrate_g ?? null,
      lipid_g: food.lipid_g ?? null,
      saturated_fat_g: food.saturated_fat_g ?? null,
      monounsaturated_fat_g: food.monounsaturated_fat_g ?? null,
      polyunsaturated_fat_g: food.polyunsaturated_fat_g ?? null,
      cholesterol_mg: food.cholesterol_mg ?? null,
      fiber_g: food.fiber_g ?? null,
      sodium_mg: food.sodium_mg ?? null,
      calcium_mg: food.calcium_mg ?? null,
      magnesium_mg: food.magnesium_mg ?? null,
      phosphorus_mg: food.phosphorus_mg ?? null,
      iron_mg: food.iron_mg ?? null,
      potassium_mg: food.potassium_mg ?? null,
      copper_mg: food.copper_mg ?? null,
      zinc_mg: food.zinc_mg ?? null,
      manganese_mg: food.manganese_mg ?? null,
      retinol_mcg: food.retinol_mcg ?? null,
      thiamine_mg: food.thiamine_mg ?? null,
      riboflavin_mg: food.riboflavin_mg ?? null,
      pyridoxine_mg: food.pyridoxine_mg ?? null,
      niacin_mg: food.niacin_mg ?? null,
      vitamin_c_mg: food.vitamin_c_mg ?? null,
      price_brl: food.price_brl ?? null,
      price_reference_g: food.price_reference_g ?? null,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FoodFormData) =>
      FoodsService.updateFood({ id: food.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Alimento atualizado com sucesso")
      setIsOpen(false)
      onSuccess()
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] })
    },
  })

  const onSubmit = (data: FoodFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Pencil />
        Edit Food
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit Food</DialogTitle>
              <DialogDescription>
                Atualize os dados do alimento (valores por 100g).
              </DialogDescription>
            </DialogHeader>
            <div className="flex max-h-[65vh] flex-col gap-6 overflow-y-auto py-4 pr-1">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nome <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Nome" type="text" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="food_group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Cereais e derivados"
                          type="text"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fonte</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="TACO, TBCA, manual..."
                          type="text"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FoodNumberFields control={form.control} />
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

export default EditFood
