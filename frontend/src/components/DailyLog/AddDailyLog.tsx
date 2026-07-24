import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { DailyLogsService } from "@/client"
import { FoodCombobox } from "@/components/Common/FoodCombobox"
import { RecipeCombobox } from "@/components/Common/RecipeCombobox"
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
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError, nowForTimeInput } from "@/utils"

const quickAddSchema = z
  .object({
    entry_type: z.enum(["food", "recipe"]),
    food_id: z.string().optional(),
    food_name: z.string().optional(),
    quantity_g: z.number().nullable().optional(),
    recipe_id: z.string().optional(),
    recipe_name: z.string().optional(),
    recipe_servings: z.number().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.entry_type === "food") {
      if (!data.food_id) {
        ctx.addIssue({
          code: "custom",
          path: ["food_id"],
          message: "Selecione um alimento",
        })
      }
      if (data.quantity_g == null || data.quantity_g <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["quantity_g"],
          message: "Quantidade deve ser maior que 0",
        })
      }
    } else {
      if (!data.recipe_id) {
        ctx.addIssue({
          code: "custom",
          path: ["recipe_id"],
          message: "Selecione uma receita",
        })
      }
      if (data.recipe_servings == null || data.recipe_servings <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["recipe_servings"],
          message: "Porções deve ser maior que 0",
        })
      }
    }
  })
type QuickAddFormData = z.infer<typeof quickAddSchema>

const emptyQuickAdd = (): QuickAddFormData => ({
  entry_type: "food",
  food_id: "",
  food_name: "",
  quantity_g: null,
  recipe_id: "",
  recipe_name: "",
  recipe_servings: null,
})

interface DraftItem {
  key: string
  entry_type: "food" | "recipe"
  displayLabel: string
  food_id?: string
  quantity_g?: number
  recipe_id?: string
  recipe_servings?: number
}

interface AddDailyLogProps {
  selectedDate: string
}

const AddDailyLog = ({ selectedDate }: AddDailyLogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useState(selectedDate)
  const [time, setTime] = useState(nowForTimeInput())
  const [label, setLabel] = useState("")
  const [items, setItems] = useState<DraftItem[]>([])
  const [comboboxResetKey, setComboboxResetKey] = useState(0)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const quickAddForm = useForm<QuickAddFormData>({
    resolver: zodResolver(quickAddSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: emptyQuickAdd(),
  })
  const entryType = quickAddForm.watch("entry_type")

  const resetAll = () => {
    setDate(selectedDate)
    setTime(nowForTimeInput())
    setLabel("")
    setItems([])
    quickAddForm.reset(emptyQuickAdd())
    setComboboxResetKey((key) => key + 1)
  }

  const handleAddItem = (data: QuickAddFormData) => {
    if (data.entry_type === "food") {
      setItems((prev) => [
        ...prev,
        {
          key: crypto.randomUUID(),
          entry_type: "food",
          displayLabel: `${data.food_name} ${data.quantity_g}g`,
          food_id: data.food_id,
          quantity_g: data.quantity_g ?? undefined,
        },
      ])
    } else {
      setItems((prev) => [
        ...prev,
        {
          key: crypto.randomUUID(),
          entry_type: "recipe",
          displayLabel: `${data.recipe_name} (${data.recipe_servings} porção(ões))`,
          recipe_id: data.recipe_id,
          recipe_servings: data.recipe_servings ?? undefined,
        },
      ])
    }
    quickAddForm.reset(emptyQuickAdd())
    setComboboxResetKey((key) => key + 1)
  }

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const entry_datetime = new Date(`${date}T${time}`).toISOString()
      await Promise.all(
        items.map((item) =>
          DailyLogsService.createDailyLog({
            requestBody: {
              entry_type: item.entry_type,
              entry_datetime,
              label: label || undefined,
              food_id: item.entry_type === "food" ? item.food_id : undefined,
              quantity_g:
                item.entry_type === "food" ? item.quantity_g : undefined,
              recipe_id:
                item.entry_type === "recipe" ? item.recipe_id : undefined,
              recipe_servings:
                item.entry_type === "recipe" ? item.recipe_servings : undefined,
            },
          }),
        ),
      )
    },
    onSuccess: () => {
      showSuccessToast("Registros criados com sucesso")
      resetAll()
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] })
    },
  })

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetAll()
      }}
    >
      <DialogTrigger asChild>
        <Button className="my-4">
          <Plus className="mr-2" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Entry</DialogTitle>
          <DialogDescription>
            Registre uma refeição com um ou mais alimentos ou receitas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto py-2 pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="batch-date">Data</Label>
              <Input
                id="batch-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="batch-time">Hora</Label>
              <Input
                id="batch-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="batch-label">Rótulo</Label>
            <Input
              id="batch-label"
              placeholder="Ex: Almoço, Pré-treino..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 border-t pt-4">
            <Form {...quickAddForm}>
              <form
                onSubmit={quickAddForm.handleSubmit(handleAddItem)}
                className="flex flex-col gap-3"
              >
                <FormField
                  control={quickAddForm.control}
                  name="entry_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alimento ou receita?</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                      control={quickAddForm.control}
                      name="food_id"
                      render={() => (
                        <FormItem>
                          <FormLabel>Alimento</FormLabel>
                          <FormControl>
                            <FoodCombobox
                              key={comboboxResetKey}
                              value={
                                quickAddForm.watch("food_id")
                                  ? {
                                      id: quickAddForm.watch("food_id") ?? "",
                                      name:
                                        quickAddForm.watch("food_name") ?? "",
                                    }
                                  : null
                              }
                              onChange={(food) => {
                                quickAddForm.setValue("food_id", food.id, {
                                  shouldValidate: true,
                                })
                                quickAddForm.setValue("food_name", food.name)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={quickAddForm.control}
                      name="quantity_g"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade (g)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              placeholder="Quantidade (g)"
                              value={
                                typeof field.value === "number"
                                  ? field.value
                                  : ""
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
                  </>
                ) : (
                  <>
                    <FormField
                      control={quickAddForm.control}
                      name="recipe_id"
                      render={() => (
                        <FormItem>
                          <FormLabel>Receita</FormLabel>
                          <FormControl>
                            <RecipeCombobox
                              key={comboboxResetKey}
                              value={
                                quickAddForm.watch("recipe_id")
                                  ? {
                                      id: quickAddForm.watch("recipe_id") ?? "",
                                      name:
                                        quickAddForm.watch("recipe_name") ?? "",
                                    }
                                  : null
                              }
                              onChange={(recipe) => {
                                quickAddForm.setValue("recipe_id", recipe.id, {
                                  shouldValidate: true,
                                })
                                quickAddForm.setValue(
                                  "recipe_name",
                                  recipe.name,
                                )
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={quickAddForm.control}
                      name="recipe_servings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porções</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              placeholder="Ex: 1, 0.5..."
                              value={
                                typeof field.value === "number"
                                  ? field.value
                                  : ""
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
                  </>
                )}

                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="self-start"
                >
                  <Plus className="mr-2 size-4" />
                  Adicionar
                </Button>
              </form>
            </Form>
          </div>

          {items.length > 0 && (
            <div className="flex flex-col gap-2 border-t pt-4">
              <h4 className="text-sm font-semibold">Itens</h4>
              <ul className="flex flex-col gap-1.5">
                {items.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                  >
                    <span>{item.displayLabel}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => removeItem(item.key)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Remover item</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={confirmMutation.isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <LoadingButton
            type="button"
            loading={confirmMutation.isPending}
            disabled={items.length === 0 || !date || !time}
            onClick={() => confirmMutation.mutate()}
          >
            Confirmar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddDailyLog
