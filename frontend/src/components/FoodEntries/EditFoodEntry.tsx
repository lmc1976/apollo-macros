import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { FoodEntriesService, type FoodEntryPublic } from "@/client"
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

function toDatetimeLocalInputValue(isoString: string) {
  const date = new Date(isoString)
  const tzOffsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16)
}

const formSchema = z.object({
  food_name: z.string().min(1, { message: "Food name is required" }),
  quantity_g: z
    .number({ message: "Quantity is required" })
    .positive({ message: "Quantity must be greater than 0" }),
  calories: z
    .number({ message: "Calories is required" })
    .min(0, { message: "Calories must be 0 or greater" }),
  protein_g: z
    .number({ message: "Protein is required" })
    .min(0, { message: "Protein must be 0 or greater" }),
  carbs_g: z
    .number({ message: "Carbohydrate is required" })
    .min(0, { message: "Carbohydrate must be 0 or greater" }),
  fat_g: z
    .number({ message: "Fat is required" })
    .min(0, { message: "Fat must be 0 or greater" }),
  entry_datetime: z.string().min(1, { message: "Date/time is required" }),
})

type FormData = z.infer<typeof formSchema>

interface EditFoodEntryProps {
  foodEntry: FoodEntryPublic
  onSuccess: () => void
}

const EditFoodEntry = ({ foodEntry, onSuccess }: EditFoodEntryProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      food_name: foodEntry.food_name,
      quantity_g: foodEntry.quantity_g,
      calories: foodEntry.calories,
      protein_g: foodEntry.protein_g,
      carbs_g: foodEntry.carbs_g,
      fat_g: foodEntry.fat_g,
      entry_datetime: foodEntry.entry_datetime
        ? toDatetimeLocalInputValue(foodEntry.entry_datetime)
        : "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      FoodEntriesService.updateFoodEntry({
        id: foodEntry.id,
        requestBody: {
          ...data,
          entry_datetime: new Date(data.entry_datetime).toISOString(),
        },
      }),
    onSuccess: () => {
      showSuccessToast("Food entry updated successfully")
      setIsOpen(false)
      onSuccess()
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["food-entries"] })
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Pencil />
        Edit Food Entry
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit Food Entry</DialogTitle>
              <DialogDescription>
                Update the food entry details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="food_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Food name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Food name" type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity_g"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quantity (g) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Quantity (g)"
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

              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Calories (kcal){" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Calories"
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

              <FormField
                control={form.control}
                name="protein_g"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Protein (g) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Protein (g)"
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

              <FormField
                control={form.control}
                name="carbs_g"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Carbohydrate (g){" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Carbohydrate (g)"
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

              <FormField
                control={form.control}
                name="fat_g"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Fat (g) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Fat (g)"
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

              <FormField
                control={form.control}
                name="entry_datetime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Date/time <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

export default EditFoodEntry
