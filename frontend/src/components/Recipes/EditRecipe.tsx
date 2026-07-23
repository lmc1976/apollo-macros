import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { type RecipePublic, RecipesService } from "@/client"
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
import { RecipeIngredientFields } from "./RecipeIngredientFields"
import { type RecipeFormData, recipeFormSchema } from "./recipeFormSchema"

interface EditRecipeProps {
  recipe: RecipePublic
  onSuccess: () => void
}

const EditRecipe = ({ recipe, onSuccess }: EditRecipeProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeFormSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: recipe.name,
      ingredients: recipe.ingredients.map((ingredient) => ({
        food_id: ingredient.food_id,
        food_name: ingredient.food_name,
        quantity_g: ingredient.quantity_g,
      })),
    },
  })

  const mutation = useMutation({
    mutationFn: (data: RecipeFormData) =>
      RecipesService.updateRecipe({
        id: recipe.id,
        requestBody: {
          name: data.name,
          ingredients: data.ingredients.map((ingredient) => ({
            food_id: ingredient.food_id,
            quantity_g: ingredient.quantity_g,
          })),
        },
      }),
    onSuccess: () => {
      showSuccessToast("Receita atualizada com sucesso")
      setIsOpen(false)
      onSuccess()
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] })
    },
  })

  const onSubmit = (data: RecipeFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Pencil />
        Edit Recipe
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit Recipe</DialogTitle>
              <DialogDescription>
                Atualize o nome e os alimentos da receita.
              </DialogDescription>
            </DialogHeader>
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

export default EditRecipe
