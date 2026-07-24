import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { type RecipeCreate, RecipesService } from "@/client"
import { Button } from "@/components/ui/button"
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
import { handleError } from "@/utils"
import { RecipeIngredientFields } from "./RecipeIngredientFields"
import { type RecipeFormData, recipeFormSchema } from "./recipeFormSchema"

const emptyDefaultValues = (): RecipeFormData => ({
  name: "",
  yield_servings: 1,
  ingredients: [{ food_id: "", food_name: "", quantity_g: 0 }],
})

const AddRecipe = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeFormSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: emptyDefaultValues(),
  })

  const mutation = useMutation({
    mutationFn: (data: RecipeCreate) =>
      RecipesService.createRecipe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Receita criada com sucesso")
      form.reset(emptyDefaultValues())
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] })
    },
  })

  const onSubmit = (data: RecipeFormData) => {
    mutation.mutate({
      name: data.name,
      yield_servings: data.yield_servings,
      ingredients: data.ingredients.map((ingredient) => ({
        food_id: ingredient.food_id,
        quantity_g: ingredient.quantity_g,
      })),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="my-4">
          <Plus className="mr-2" />
          Add Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Recipe</DialogTitle>
          <DialogDescription>
            Crie um modelo reutilizável de receita com seus alimentos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nome <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Omelete, Vitamina de banana..."
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
                name="yield_servings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Rende quantas porções?{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 2"
                        type="number"
                        step="any"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <RecipeIngredientFields form={form} />
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

export default AddRecipe
